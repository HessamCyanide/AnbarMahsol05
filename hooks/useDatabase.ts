

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Product, Tag, Category, Transaction, User, Permission, TransactionType, InvoiceItem, Log } from '../types';
import { ALL_PERMISSIONS } from '../constants';

const DB_NAME = 'inventory_db_v1';

const useDatabase = () => {
  const [db, setDb] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  
  const initDb = useCallback(async () => {
    try {
      // @ts-ignore
      const SQL = await initSqlJs({
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
      });
      
      const storedDb = localStorage.getItem(DB_NAME);
      let database;

      const createSchema = (d: any) => {
        d.exec(`
          CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            quantity INTEGER NOT NULL,
            lastUpdated TEXT NOT NULL
          );
          CREATE TABLE IF NOT EXISTS tags (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            color TEXT NOT NULL
          );
          CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE
          );
          CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            invoiceNumber TEXT,
            productId TEXT NOT NULL,
            quantityChange INTEGER NOT NULL,
            timestamp TEXT NOT NULL,
            FOREIGN KEY (productId) REFERENCES products (id) ON DELETE CASCADE
          );
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            profilePicture TEXT
          );
          CREATE TABLE IF NOT EXISTS permissions (
            userId TEXT NOT NULL,
            permission TEXT NOT NULL,
            PRIMARY KEY (userId, permission),
            FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
          );
          CREATE TABLE IF NOT EXISTS product_tags (
            productId TEXT NOT NULL,
            tagId TEXT NOT NULL,
            PRIMARY KEY (productId, tagId),
            FOREIGN KEY (productId) REFERENCES products (id) ON DELETE CASCADE,
            FOREIGN KEY (tagId) REFERENCES tags (id) ON DELETE CASCADE
          );
          CREATE TABLE IF NOT EXISTS product_categories (
            productId TEXT NOT NULL,
            categoryId TEXT NOT NULL,
            PRIMARY KEY (productId, categoryId),
            FOREIGN KEY (productId) REFERENCES products (id) ON DELETE CASCADE,
            FOREIGN KEY (categoryId) REFERENCES categories (id) ON DELETE CASCADE
          );
          CREATE TABLE IF NOT EXISTS user_allowed_categories (
            userId TEXT NOT NULL,
            categoryId TEXT NOT NULL,
            PRIMARY KEY (userId, categoryId),
            FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE
          );
          CREATE TABLE IF NOT EXISTS user_allowed_tag_prefixes (
            userId TEXT NOT NULL,
            prefix TEXT NOT NULL,
            PRIMARY KEY (userId, prefix),
            FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
          );
          CREATE TABLE IF NOT EXISTS logs (
            id TEXT PRIMARY KEY,
            timestamp TEXT NOT NULL,
            userId TEXT NOT NULL,
            username TEXT NOT NULL,
            action TEXT NOT NULL,
            details TEXT
          );
        `);
      };

      const persistDbLocal = (databaseInstance: any) => {
          if(!databaseInstance) return;
          const data = databaseInstance.export();
          localStorage.setItem(DB_NAME, JSON.stringify(Array.from(data)));
      };
      
      if (storedDb) {
        const dbArray = new Uint8Array(JSON.parse(storedDb));
        database = new SQL.Database(dbArray);
      } else {
        database = new SQL.Database();
      }

      createSchema(database);

      const getSingleValue = (stmt: any) => {
        let value = null;
        if (stmt.step()) {
          value = stmt.get()[0];
        }
        stmt.free();
        return value;
      };
      
      const getUserIdByUsername = (username: string) => {
        const stmt = database.prepare("SELECT id FROM users WHERE lower(username) = ?");
        stmt.bind([username.toLowerCase()]);
        return getSingleValue(stmt);
      };

      database.exec("BEGIN TRANSACTION");
      try {
        let userId: string | null = getUserIdByUsername('h.delkhosh');

        if (!userId) {
            const oldUserId = getUserIdByUsername('cyanide');
            if (oldUserId) {
                userId = oldUserId;
                database.run("UPDATE users SET username = ? WHERE id = ?", ['h.delkhosh', userId]);
            }
        }

        if (userId) {
            const stmt = database.prepare("SELECT COUNT(*) FROM permissions WHERE userId = ?");
            stmt.bind([userId]);
            const permCount = getSingleValue(stmt) as number;

            if (permCount < ALL_PERMISSIONS.length) {
                database.run("DELETE FROM permissions WHERE userId = ?", [userId]);
                const permStmt = database.prepare("INSERT INTO permissions (userId, permission) VALUES (?, ?)");
                ALL_PERMISSIONS.forEach(p => permStmt.run([userId, p.id]));
                permStmt.free();
            }
        } else {
            userId = `user-admin-${Date.now()}`;
            database.run("INSERT INTO users (id, username, password, profilePicture) VALUES (?, ?, ?, ?)", [userId, 'h.delkhosh', 'He2506875', null]);
            
            const permStmt = database.prepare("INSERT INTO permissions (userId, permission) VALUES (?, ?)");
            ALL_PERMISSIONS.forEach(p => permStmt.run([userId, p.id]));
            permStmt.free();
        }
        
        database.exec("COMMIT");
      } catch(e) {
          database.exec("ROLLBACK");
          console.error("Admin user verification and repair transaction failed.", e);
      }
      
      persistDbLocal(database);
      setDb(database);
    } catch (err) {
      console.error("Failed to initialize database:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initDb();
  }, [initDb]);
  
  const persistDb = useCallback(() => {
      if(!db) return;
      const data = db.export();
      localStorage.setItem(DB_NAME, JSON.stringify(Array.from(data)));
  },[db]);

  const parseResult = (execResult: any) => {
      if (!execResult || execResult.length === 0) return [];
      const { columns, values } = execResult[0];
      return values.map((row: any[]) => {
          const obj: any = {};
          columns.forEach((col: string, i: number) => {
              obj[col] = row[i];
          });
          return obj;
      });
  };

  const mapProductData = (products: any[], tags: any[], categories: any[]) => {
      const productTags = new Map<string, string[]>();
      tags.forEach(row => {
          if (!productTags.has(row.productId)) productTags.set(row.productId, []);
          productTags.get(row.productId)?.push(row.tagId);
      });
      const productCategories = new Map<string, string[]>();
      categories.forEach(row => {
          if (!productCategories.has(row.productId)) productCategories.set(row.productId, []);
          productCategories.get(row.productId)?.push(row.categoryId);
      });

      return products.map(p => ({ ...p, tagIds: productTags.get(p.id) || [], categoryIds: productCategories.get(p.id) || [] }));
  };

  const mapUserData = (users: any[], permissions: any[], allowedCategories: any[], allowedPrefixes: any[]) => {
      const userPermissions = new Map<string, Permission[]>();
      permissions.forEach(row => {
          if(!userPermissions.has(row.userId)) userPermissions.set(row.userId, []);
          userPermissions.get(row.userId)?.push(row.permission as Permission);
      });

      const userAllowedCategories = new Map<string, string[]>();
        allowedCategories.forEach(row => {
            if(!userAllowedCategories.has(row.userId)) userAllowedCategories.set(row.userId, []);
            userAllowedCategories.get(row.userId)?.push(row.categoryId);
        });
        
      const userAllowedPrefixes = new Map<string, string[]>();
      allowedPrefixes.forEach(row => {
          if(!userAllowedPrefixes.has(row.userId)) userAllowedPrefixes.set(row.userId, []);
          userAllowedPrefixes.get(row.userId)?.push(row.prefix);
      });

      return users.map(u => ({
        ...u, 
        permissions: userPermissions.get(u.id) || [],
        allowedCategoryIds: userAllowedCategories.get(u.id) || [],
        allowedTagPrefixes: userAllowedPrefixes.get(u.id) || []
      }));
  }

  const dbRun = useCallback((sql: string, params: any[] = []) => {
    if (!db) throw new Error("Database not initialized");
    db.run(sql, params);
  }, [db]);

  const getAllData = useCallback(async () => {
    if (!db) throw new Error("DB not ready");
    const productsRes = parseResult(db.exec('SELECT * FROM products'));
    const tagsRes = parseResult(db.exec('SELECT * FROM tags'));
    const categoriesRes = parseResult(db.exec('SELECT * FROM categories'));
    const transactionsRes = parseResult(db.exec('SELECT * FROM transactions ORDER BY timestamp DESC'));
    const usersRes = parseResult(db.exec('SELECT id, username, password, profilePicture FROM users'));
    const permissionsRes = parseResult(db.exec('SELECT * FROM permissions'));
    const productTagsRes = parseResult(db.exec('SELECT * FROM product_tags'));
    const productCategoriesRes = parseResult(db.exec('SELECT * FROM product_categories'));
    const allowedCategoriesRes = parseResult(db.exec('SELECT * FROM user_allowed_categories'));
    const allowedPrefixesRes = parseResult(db.exec('SELECT * FROM user_allowed_tag_prefixes'));
    const logsRes = parseResult(db.exec('SELECT * FROM logs ORDER BY timestamp DESC'));

    return {
        products: mapProductData(productsRes, productTagsRes, productCategoriesRes),
        tags: tagsRes,
        categories: categoriesRes,
        transactions: transactionsRes,
        users: mapUserData(usersRes, permissionsRes, allowedCategoriesRes, allowedPrefixesRes),
        logs: logsRes,
    }
  }, [db]);
  
  const refreshData = useCallback(async () => {
     setLoading(true);
     await initDb();
     setLoading(false);
  }, [initDb]);

  const exportDatabase = useCallback(async (): Promise<Uint8Array> => {
      if(!db) throw new Error("DB not ready");
      return db.export();
  }, [db]);

  const importDatabase = useCallback(async (data: Uint8Array) => {
      setLoading(true);
      try {
          // @ts-ignore
          const SQL = await initSqlJs({ locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}` });
          const newDb = new SQL.Database(data);
          setDb(newDb);
          const dataToPersist = newDb.export();
          localStorage.setItem(DB_NAME, JSON.stringify(Array.from(dataToPersist)));
      } catch(e) {
          console.error("Error importing DB", e);
          throw e;
      } finally {
          setLoading(false);
      }
  }, []);
  
  const logAction = useCallback(async (action: string, details: string, user: User) => {
    if (!db || !user) return;
    const logId = `log-${Date.now()}-${Math.random()}`;
    const timestamp = new Date().toISOString();
    dbRun("INSERT INTO logs (id, timestamp, userId, username, action, details) VALUES (?, ?, ?, ?, ?, ?)", [
        logId,
        timestamp,
        user.id,
        user.username,
        action,
        details
    ]);
    persistDb();
  }, [db, dbRun, persistDb]);

  const checkUserCredentials = useCallback(async (username: string, password: string): Promise<User | null> => {
      if(!db) return null;
      
      const userStmt = db.prepare("SELECT id, username, password, profilePicture FROM users WHERE lower(username) = ? AND password = ?");
      userStmt.bind([username.toLowerCase(), password]);

      let userResult: any = null;
      if (userStmt.step()) {
          const res = userStmt.get();
          userResult = { id: res[0], username: res[1], password: res[2], profilePicture: res[3] };
      }
      userStmt.free();

      if (!userResult) return null;
      
      const fullUser = await getUserById(userResult.id);
      return fullUser;
  }, [db]);

  const getUserById = useCallback(async (userId: string): Promise<User | null> => {
       if(!db) return null;
       const userStmt = db.prepare("SELECT id, username, password, profilePicture FROM users WHERE id = ?");
       userStmt.bind([userId]);

       let user: any = null;
       if(userStmt.step()){
           const res = userStmt.get();
           user = { id: res[0], username: res[1], password: res[2], profilePicture: res[3] };
       }
       userStmt.free();

       if(!user) return null;

       const permStmt = db.prepare("SELECT permission FROM permissions WHERE userId = ?");
       permStmt.bind([user.id]);
       const permissions: Permission[] = [];
       while(permStmt.step()) {
           permissions.push(permStmt.get()[0] as Permission);
       }
       permStmt.free();

       const catStmt = db.prepare("SELECT categoryId FROM user_allowed_categories WHERE userId = ?");
       catStmt.bind([user.id]);
       const allowedCategoryIds: string[] = [];
       while(catStmt.step()) {
           allowedCategoryIds.push(catStmt.get()[0] as string);
       }
       catStmt.free();

       const prefixStmt = db.prepare("SELECT prefix FROM user_allowed_tag_prefixes WHERE userId = ?");
       prefixStmt.bind([user.id]);
       const allowedTagPrefixes: string[] = [];
       while(prefixStmt.step()) {
           allowedTagPrefixes.push(prefixStmt.get()[0] as string);
       }
       prefixStmt.free();

       return { ...user, permissions, allowedCategoryIds, allowedTagPrefixes };
  }, [db]);

  const saveUser = useCallback(async (user: User) => {
    if (!db) return;

    db.exec("BEGIN TRANSACTION");
    try {
        let userId = user.id;

        if (userId) { 
            if (user.password && user.password.trim() !== '') {
            dbRun("UPDATE users SET username = ?, password = ? WHERE id = ?", [user.username, user.password, userId]);
            } else {
            dbRun("UPDATE users SET username = ? WHERE id = ?", [user.username, userId]);
            }
        } else { 
            if (!user.password || user.password.trim() === '') throw new Error("A password is required for new users.");
            
            userId = `user-${Date.now()}`;
            dbRun("INSERT INTO users (id, username, password) VALUES (?, ?, ?)", [userId, user.username, user.password]);
            user.id = userId; // Update the user object with the new ID
        }
        
        dbRun("DELETE FROM permissions WHERE userId = ?", [userId]);
        const permStmt = db.prepare("INSERT INTO permissions (userId, permission) VALUES (?, ?)");
        user.permissions.forEach(p => permStmt.run([userId, p]));
        permStmt.free();
        
        dbRun("DELETE FROM user_allowed_categories WHERE userId = ?", [userId]);
        const catStmt = db.prepare("INSERT INTO user_allowed_categories (userId, categoryId) VALUES (?, ?)");
        (user.allowedCategoryIds || []).forEach(catId => catStmt.run([userId, catId]));
        catStmt.free();

        dbRun("DELETE FROM user_allowed_tag_prefixes WHERE userId = ?", [userId]);
        const prefixStmt = db.prepare("INSERT INTO user_allowed_tag_prefixes (userId, prefix) VALUES (?, ?)");
        (user.allowedTagPrefixes || []).forEach(prefix => prefixStmt.run([userId, prefix]));
        prefixStmt.free();

      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      console.error("Failed to save user:", e);
      throw e;
    }

    persistDb();
  }, [db, dbRun, persistDb]);

  const deleteUser = useCallback(async (userId: string) => {
      dbRun("DELETE FROM users WHERE id = ?", [userId]);
      persistDb();
  }, [dbRun, persistDb]);

  const saveProduct = useCallback(async (product: Product) => {
      if(!db) return;
      const { id, name, quantity, lastUpdated, tagIds, categoryIds } = product;
      
      db.exec("BEGIN TRANSACTION");
      try {
        const checkStmt = db.prepare("SELECT id FROM products WHERE id = ?");
        checkStmt.bind([id]);
        const exists = checkStmt.step();
        checkStmt.free();

        if(exists) {
            dbRun("UPDATE products SET name = ?, quantity = ?, lastUpdated = ? WHERE id = ?", [name, quantity, lastUpdated, id]);
        } else {
            dbRun("INSERT INTO products (id, name, quantity, lastUpdated) VALUES (?, ?, ?, ?)", [id, name, quantity, lastUpdated]);
        }
        
        dbRun("DELETE FROM product_tags WHERE productId = ?", [id]);
        if (tagIds.length > 0) {
            const tagStmt = db.prepare("INSERT INTO product_tags (productId, tagId) VALUES (?, ?)");
            tagIds.forEach(tagId => tagStmt.run([id, tagId]));
            tagStmt.free();
        }

        dbRun("DELETE FROM product_categories WHERE productId = ?", [id]);
        if (categoryIds.length > 0) {
            const catStmt = db.prepare("INSERT INTO product_categories (productId, categoryId) VALUES (?, ?)");
            categoryIds.forEach(catId => catStmt.run([id, catId]));
            catStmt.free();
        }
        
        db.exec("COMMIT");
      } catch (e) {
          db.exec("ROLLBACK");
          console.error("Failed to save product:", e);
          throw e;
      }
      
      persistDb();
  }, [db, dbRun, persistDb]);

  const deleteProduct = useCallback(async (productId: string) => {
      dbRun("DELETE FROM products WHERE id = ?", [productId]);
      persistDb();
  }, [dbRun, persistDb]);

  const saveTag = useCallback(async (tag: Tag): Promise<Tag> => {
      if(!db) throw new Error("DB not ready");
      tag.id = `tag-${Date.now()}`;
      tag.color = `hsl(${Math.floor(Math.random() * 360)}, 70%, 55%)`;
      dbRun("INSERT INTO tags (id, name, color) VALUES (?, ?, ?)", [tag.id, tag.name, tag.color]);
      persistDb();
      return tag;
  }, [dbRun, persistDb]);

  const updateTag = useCallback(async (tag: Tag) => {
    if (!db) throw new Error("DB not ready");
    
    const checkStmt = db.prepare("SELECT id FROM tags WHERE lower(name) = ? AND id != ?");
    checkStmt.bind([tag.name.toLowerCase(), tag.id]);
    const exists = checkStmt.step();
    checkStmt.free();
    if (exists) {
        throw new Error("تگی با این نام از قبل وجود دارد.");
    }

    dbRun("UPDATE tags SET name = ? WHERE id = ?", [tag.name, tag.id]);
    persistDb();
  }, [dbRun, persistDb]);

  const deleteTag = useCallback(async (tagId: string) => {
      dbRun("DELETE FROM tags WHERE id = ?", [tagId]);
      persistDb();
  }, [dbRun, persistDb]);

  const saveCategory = useCallback(async (category: Category): Promise<Category> => {
      if(!db) throw new Error("DB not ready");
      category.id = `cat-${Date.now()}`;
      dbRun("INSERT INTO categories (id, name) VALUES (?, ?)", [category.id, category.name]);
      persistDb();
      return category;
  }, [dbRun, persistDb]);

  const updateCategory = useCallback(async (category: Category) => {
    if (!db) throw new Error("DB not ready");

    const checkStmt = db.prepare("SELECT id FROM categories WHERE lower(name) = ? AND id != ?");
    checkStmt.bind([category.name.toLowerCase(), category.id]);
    const exists = checkStmt.step();
    checkStmt.free();
    if (exists) {
        throw new Error("دسته‌بندی با این نام از قبل وجود دارد.");
    }
    
    dbRun("UPDATE categories SET name = ? WHERE id = ?", [category.name, category.id]);
    persistDb();
  }, [dbRun, persistDb]);
  
  const deleteCategory = useCallback(async (categoryId: string) => {
      dbRun("DELETE FROM categories WHERE id = ?", [categoryId]);
      persistDb();
  }, [dbRun, persistDb]);
  
  const saveInvoice = useCallback(async (invoice: { type: TransactionType, invoiceNumber: string, items: InvoiceItem[] }) => {
    if(!db) return;
    const { type, invoiceNumber, items } = invoice;
    const timestamp = new Date().toISOString();
    
    db.exec("BEGIN TRANSACTION");
    try {
        const txStmt = db.prepare("INSERT INTO transactions (id, type, invoiceNumber, productId, quantityChange, timestamp) VALUES (?, ?, ?, ?, ?, ?)");
        const productStmt = db.prepare("UPDATE products SET quantity = quantity + ?, lastUpdated = ? WHERE id = ?");

        items.forEach(item => {
            const quantityChange = type === 'purchase' ? item.quantity : -item.quantity;
            txStmt.run([`tx-${Date.now()}-${Math.random()}`, type, invoiceNumber, item.productId, quantityChange, timestamp]);
            productStmt.run([quantityChange, timestamp, item.productId]);
        });

        txStmt.free();
        productStmt.free();
        db.exec("COMMIT");
    } catch (e) {
        db.exec("ROLLBACK");
        console.error("Transaction failed:", e);
        throw e;
    }
    persistDb();
  }, [db, persistDb]);
  
  const deleteTransaction = useCallback(async (transactionId: string) => {
    if(!db) return;
    
    const txStmt = db.prepare("SELECT productId, quantityChange FROM transactions WHERE id = ?");
    txStmt.bind([transactionId]);
    let txData: {productId: string, quantityChange: number} | null = null;
    if(txStmt.step()){
        const res = txStmt.get();
        txData = { productId: res[0] as string, quantityChange: res[1] as number };
    }
    txStmt.free();
    
    if(!txData) return;
    const { productId, quantityChange } = txData;

    db.exec("BEGIN TRANSACTION");
    try {
        db.run("UPDATE products SET quantity = quantity - ? WHERE id = ?", [quantityChange, productId]);
        db.run("DELETE FROM transactions WHERE id = ?", [transactionId]);
        db.exec("COMMIT");
        persistDb();
    } catch(e) {
        db.exec("ROLLBACK");
        console.error("Delete transaction failed", e);
        throw e;
    }
  }, [db, persistDb]);
  
    const updateTransaction = useCallback(async (transactionId: string, newDetails: { quantityChange: number, invoiceNumber: string }) => {
        if (!db) return;

        db.exec("BEGIN TRANSACTION");
        try {
            const oldTxStmt = db.prepare("SELECT productId, quantityChange FROM transactions WHERE id = ?");
            oldTxStmt.bind([transactionId]);
            let oldTxData: { productId: string, quantityChange: number } | null = null;
            if (oldTxStmt.step()) {
                const res = oldTxStmt.get();
                oldTxData = { productId: res[0] as string, quantityChange: res[1] as number };
            }
            oldTxStmt.free();

            if (!oldTxData) throw new Error("Transaction not found");

            const { productId, quantityChange: oldQuantityChange } = oldTxData;
            const newQuantityChange = newDetails.quantityChange;

            if (newQuantityChange !== oldQuantityChange) {
                const quantityDifference = newQuantityChange - oldQuantityChange;
                db.run("UPDATE products SET quantity = quantity + ?, lastUpdated = ? WHERE id = ?", [quantityDifference, new Date().toISOString(), productId]);
            }
            
            db.run(
                "UPDATE transactions SET quantityChange = ?, invoiceNumber = ?, timestamp = ? WHERE id = ?",
                [newQuantityChange, newDetails.invoiceNumber, new Date().toISOString(), transactionId]
            );

            db.exec("COMMIT");
            persistDb();
        } catch (e) {
            db.exec("ROLLBACK");
            console.error("Update transaction failed", e);
            throw e;
        }
    }, [db, persistDb]);

  const recountStock = useCallback(async (productId: string, newQuantity: number, notes: string) => {
    if (!db) throw new Error("DB not ready");

    db.exec("BEGIN TRANSACTION");
    try {
        const productStmt = db.prepare("SELECT quantity FROM products WHERE id = ?");
        productStmt.bind([productId]);
        let currentQuantity: number | null = null;
        if (productStmt.step()) {
            currentQuantity = productStmt.get()[0] as number;
        }
        productStmt.free();

        if (currentQuantity === null) throw new Error("Product not found");

        const quantityChange = newQuantity - currentQuantity;
        const timestamp = new Date().toISOString();

        // Create a recount transaction
        db.run(
            "INSERT INTO transactions (id, type, invoiceNumber, productId, quantityChange, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
            [`tx-${Date.now()}-${Math.random()}`, 'recount', notes, productId, quantityChange, timestamp]
        );

        // Update the product's quantity
        db.run(
            "UPDATE products SET quantity = ?, lastUpdated = ? WHERE id = ?",
            [newQuantity, timestamp, productId]
        );

        db.exec("COMMIT");
        persistDb();
    } catch (e) {
        db.exec("ROLLBACK");
        console.error("Recount stock failed", e);
        throw e;
    }
  }, [db, persistDb]);

  const updateAccount = useCallback(async (
    userId: string,
    currentPassword: string,
    newUsername: string,
    newPassword: string,
    profilePicture: string | null | undefined
) => {
    if (!db) throw new Error("Database not ready");

    const passCheckStmt = db.prepare("SELECT password FROM users WHERE id = ?");
    passCheckStmt.bind([userId]);
    let dbPassword = null;
    if (passCheckStmt.step()) dbPassword = passCheckStmt.get()[0];
    passCheckStmt.free();
    if (dbPassword !== currentPassword) {
        throw new Error("رمز عبور فعلی اشتباه است.");
    }

    if (newUsername) {
        const userCheckStmt = db.prepare("SELECT id FROM users WHERE lower(username) = ? AND id != ?");
        userCheckStmt.bind([newUsername.toLowerCase(), userId]);
        if (userCheckStmt.step()) {
            userCheckStmt.free();
            throw new Error("این نام کاربری قبلا استفاده شده است.");
        }
        userCheckStmt.free();
    }
    
    const fieldsToUpdate: string[] = [];
    const params: (string | null)[] = [];

    if (newUsername) {
        fieldsToUpdate.push("username = ?");
        params.push(newUsername);
    }
    if (newPassword) {
        fieldsToUpdate.push("password = ?");
        params.push(newPassword);
    }
    if (profilePicture !== undefined) { 
        fieldsToUpdate.push("profilePicture = ?");
        params.push(profilePicture);
    }

    if (fieldsToUpdate.length === 0) {
        return getUserById(userId);
    }

    const sql = `UPDATE users SET ${fieldsToUpdate.join(", ")} WHERE id = ?`;
    params.push(userId);

    dbRun(sql, params);
    persistDb();

    return getUserById(userId);
}, [db, dbRun, persistDb, getUserById]);

  const databaseApi = useMemo(() => (db ? {
    getAllData,
    checkUserCredentials,
    getUserById,
    saveUser,
    deleteUser,
    saveProduct,
    deleteProduct,
    saveTag,
    updateTag,
    deleteTag,
    saveCategory,
    updateCategory,
    deleteCategory,
    saveInvoice,
    deleteTransaction,
    updateTransaction,
    recountStock,
    updateAccount,
    logAction,
  } : null), [
      db, getAllData, checkUserCredentials, getUserById, saveUser, deleteUser,
      saveProduct, deleteProduct, saveTag, updateTag, deleteTag, saveCategory, updateCategory, deleteCategory,
      saveInvoice, deleteTransaction, updateTransaction, recountStock, updateAccount, logAction
  ]);
  
  return { db: databaseApi, loading, exportDatabase, importDatabase, refreshData };
};

export default useDatabase;
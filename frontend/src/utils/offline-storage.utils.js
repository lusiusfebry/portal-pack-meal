// Offline storage utilities using IndexedDB for caching orders and user profile
// Fail gracefully; log errors; return defaults when unavailable
const DB_NAME = 'bebang-pack-meal-offline';
const DB_VERSION = 1;
const STORES = {
    ORDERS: 'orders',
    USER_DATA: 'user-data',
};
export async function openDB() {
    return new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
            console.error('[offline-storage] IndexedDB not supported in this environment');
            reject(new Error('IndexedDB not supported'));
            return;
        }
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            try {
                if (!db.objectStoreNames.contains(STORES.ORDERS)) {
                    db.createObjectStore(STORES.ORDERS, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(STORES.USER_DATA)) {
                    db.createObjectStore(STORES.USER_DATA, { keyPath: 'id' });
                }
            }
            catch (err) {
                console.error('[offline-storage] onupgradeneeded error', err);
            }
        };
        request.onsuccess = () => {
            resolve(request.result);
        };
        request.onerror = () => {
            console.error('[offline-storage] Failed to open IndexedDB', request.error);
            reject(request.error || new Error('Failed to open IndexedDB'));
        };
        request.onblocked = () => {
            console.warn('[offline-storage] IndexedDB open blocked (possibly multiple tabs with different versions)');
        };
    });
}
export async function saveOrdersToCache(orders) {
    try {
        const db = await openDB();
        const tx = db.transaction([STORES.ORDERS], 'readwrite');
        const store = tx.objectStore(STORES.ORDERS);
        // Clear existing cache; if this fails we still upsert items
        await new Promise((resolve) => {
            const clearReq = store.clear();
            clearReq.onsuccess = () => resolve();
            clearReq.onerror = () => {
                console.warn('[offline-storage] Failed to clear orders cache', clearReq.error);
                resolve();
            };
        });
        for (const order of orders) {
            await new Promise((resolve) => {
                const req = store.put(order);
                req.onsuccess = () => resolve();
                req.onerror = () => {
                    console.error('[offline-storage] Failed to cache order', order?.id, req.error);
                    resolve();
                };
            });
        }
        await new Promise((resolve) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => {
                console.error('[offline-storage] Transaction error while caching orders', tx.error);
                resolve();
            };
            tx.onabort = () => {
                console.error('[offline-storage] Transaction aborted while caching orders', tx.error);
                resolve();
            };
        });
        db.close();
    }
    catch (err) {
        console.error('[offline-storage] saveOrdersToCache error', err);
    }
}
export async function getOrdersFromCache() {
    try {
        const db = await openDB();
        const tx = db.transaction([STORES.ORDERS], 'readonly');
        const store = tx.objectStore(STORES.ORDERS);
        const result = await new Promise((resolve) => {
            const req = store.getAll();
            req.onsuccess = () => {
                const data = (req.result || []);
                resolve(data);
            };
            req.onerror = () => {
                console.error('[offline-storage] Failed to read orders from cache', req.error);
                resolve([]);
            };
        });
        db.close();
        return result;
    }
    catch (err) {
        console.error('[offline-storage] getOrdersFromCache error', err);
        return [];
    }
}
export async function saveUserDataToCache(user) {
    try {
        if (!user || typeof user !== 'object') {
            console.warn('[offline-storage] saveUserDataToCache called with invalid user object');
            return;
        }
        if (!('id' in user)) {
            console.warn('[offline-storage] User object missing id; cannot store in IndexedDB with keyPath "id"');
            return;
        }
        const db = await openDB();
        const tx = db.transaction([STORES.USER_DATA], 'readwrite');
        const store = tx.objectStore(STORES.USER_DATA);
        await new Promise((resolve) => {
            const req = store.put(user);
            req.onsuccess = () => resolve();
            req.onerror = () => {
                console.error('[offline-storage] Failed to cache user profile', req.error);
                resolve();
            };
        });
        await new Promise((resolve) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => {
                console.error('[offline-storage] Transaction error while caching user profile', tx.error);
                resolve();
            };
            tx.onabort = () => {
                console.error('[offline-storage] Transaction aborted while caching user profile', tx.error);
                resolve();
            };
        });
        db.close();
    }
    catch (err) {
        console.error('[offline-storage] saveUserDataToCache error', err);
    }
}
export async function getUserDataFromCache() {
    try {
        const db = await openDB();
        const tx = db.transaction([STORES.USER_DATA], 'readonly');
        const store = tx.objectStore(STORES.USER_DATA);
        const result = await new Promise((resolve) => {
            const req = store.getAll();
            req.onsuccess = () => {
                const list = req.result || [];
                resolve(list[0] ?? null);
            };
            req.onerror = () => {
                console.error('[offline-storage] Failed to read user profile from cache', req.error);
                resolve(null);
            };
        });
        db.close();
        return result;
    }
    catch (err) {
        console.error('[offline-storage] getUserDataFromCache error', err);
        return null;
    }
}
export async function clearOfflineCache() {
    try {
        const db = await openDB();
        const tx = db.transaction([STORES.ORDERS, STORES.USER_DATA], 'readwrite');
        const clearStore = (name) => new Promise((resolve) => {
            const store = tx.objectStore(name);
            const req = store.clear();
            req.onsuccess = () => resolve();
            req.onerror = () => {
                console.error(`[offline-storage] Failed to clear store "${name}"`, req.error);
                resolve();
            };
        });
        await clearStore(STORES.ORDERS);
        await clearStore(STORES.USER_DATA);
        await new Promise((resolve) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => {
                console.error('[offline-storage] Transaction error while clearing cache', tx.error);
                resolve();
            };
            tx.onabort = () => {
                console.error('[offline-storage] Transaction aborted while clearing cache', tx.error);
                resolve();
            };
        });
        db.close();
    }
    catch (err) {
        console.error('[offline-storage] clearOfflineCache error', err);
    }
}

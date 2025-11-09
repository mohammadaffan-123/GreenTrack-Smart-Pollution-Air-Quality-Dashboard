// IndexedDB wrapper for AQI Monitor
class AQIDatabase {
  constructor() {
    this.dbName = 'AQIMonitorDB';
    this.version = 1;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // AQI Data store
        if (!db.objectStoreNames.contains('aqiData')) {
          const aqiStore = db.createObjectStore('aqiData', { keyPath: 'id' });
          aqiStore.createIndex('city', 'city', { unique: false });
          aqiStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Historical data store
        if (!db.objectStoreNames.contains('historicalData')) {
          const historyStore = db.createObjectStore('historicalData', { keyPath: 'id' });
          historyStore.createIndex('city', 'city', { unique: false });
          historyStore.createIndex('date', 'date', { unique: false });
        }

        // User preferences store
        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences', { keyPath: 'key' });
        }

        // Favorites store
        if (!db.objectStoreNames.contains('favorites')) {
          db.createObjectStore('favorites', { keyPath: 'city' });
        }
      };
    });
  }

  // AQI Data operations
  async saveAQIData(data) {
    const transaction = this.db.transaction(['aqiData'], 'readwrite');
    const store = transaction.objectStore('aqiData');

    const record = {
      id: `${data.city}_${Date.now()}`,
      ...data,
      timestamp: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const request = store.add(record);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAQIData(city, limit = 50) {
    const transaction = this.db.transaction(['aqiData'], 'readonly');
    const store = transaction.objectStore('aqiData');
    const index = store.index('city');

    return new Promise((resolve, reject) => {
      const request = index.openCursor(IDBKeyRange.only(city), 'prev');
      const results = [];

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && results.length < limit) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async getLatestAQIData(city) {
    const data = await this.getAQIData(city, 1);
    return data[0] || null;
  }

  // Historical data operations
  async saveHistoricalData(city, data) {
    const transaction = this.db.transaction(['historicalData'], 'readwrite');
    const store = transaction.objectStore('historicalData');

    const record = {
      id: `${city}_${data.date}`,
      city,
      ...data
    };

    return new Promise((resolve, reject) => {
      const request = store.put(record);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getHistoricalData(city, startDate, endDate) {
    const transaction = this.db.transaction(['historicalData'], 'readonly');
    const store = transaction.objectStore('historicalData');
    const index = store.index('city');

    return new Promise((resolve, reject) => {
      const range = IDBKeyRange.only(city);
      const request = index.openCursor(range);
      const results = [];

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const record = cursor.value;
          const recordDate = new Date(record.date);
          if (recordDate >= startDate && recordDate <= endDate) {
            results.push(record);
          }
          cursor.continue();
        } else {
          resolve(results.sort((a, b) => new Date(a.date) - new Date(b.date)));
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Preferences operations
  async savePreference(key, value) {
    const transaction = this.db.transaction(['preferences'], 'readwrite');
    const store = transaction.objectStore('preferences');

    return new Promise((resolve, reject) => {
      const request = store.put({ key, value });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getPreference(key) {
    const transaction = this.db.transaction(['preferences'], 'readonly');
    const store = transaction.objectStore('preferences');

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result ? request.result.value : null);
      request.onerror = () => reject(request.error);
    });
  }

  // Favorites operations
  async addFavorite(city) {
    const transaction = this.db.transaction(['favorites'], 'readwrite');
    const store = transaction.objectStore('favorites');

    return new Promise((resolve, reject) => {
      const request = store.put({ city, addedAt: new Date().toISOString() });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removeFavorite(city) {
    const transaction = this.db.transaction(['favorites'], 'readwrite');
    const store = transaction.objectStore('favorites');

    return new Promise((resolve, reject) => {
      const request = store.delete(city);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getFavorites() {
    const transaction = this.db.transaction(['favorites'], 'readonly');
    const store = transaction.objectStore('favorites');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async isFavorite(city) {
    const transaction = this.db.transaction(['favorites'], 'readonly');
    const store = transaction.objectStore('favorites');

    return new Promise((resolve, reject) => {
      const request = store.get(city);
      request.onsuccess = () => resolve(!!request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Cleanup old data
  async cleanupOldData(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const transaction = this.db.transaction(['aqiData', 'historicalData'], 'readwrite');
    const aqiStore = transaction.objectStore('aqiData');
    const historyStore = transaction.objectStore('historicalData');

    // Clean AQI data
    const aqiIndex = aqiStore.index('timestamp');
    const aqiRange = IDBKeyRange.upperBound(cutoffDate.toISOString());
    const aqiCursorRequest = aqiIndex.openCursor(aqiRange);

    aqiCursorRequest.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    // Clean historical data (keep more historical data)
    const historyCutoff = new Date();
    historyCutoff.setDate(historyCutoff.getDate() - 90);
    const historyIndex = historyStore.index('date');
    const historyRange = IDBKeyRange.upperBound(historyCutoff.toISOString());
    const historyCursorRequest = historyIndex.openCursor(historyRange);

    historyCursorRequest.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Close database
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Global instance
const aqiDB = new AQIDatabase();

// Initialize database when module loads
if (typeof window !== 'undefined') {
  window.aqiDB = aqiDB;
  aqiDB.init().then(() => {
    console.log('[DB] IndexedDB initialized');
  }).catch((error) => {
    console.error('[DB] Failed to initialize IndexedDB:', error);
  });
}

export default AQIDatabase;

export class NetworkStatus {
  private static isOnline: boolean = typeof window !== 'undefined' ? navigator.onLine : true;
  private static listeners: Set<(online: boolean) => void> = new Set();

  static init(): void {
    if (typeof window === 'undefined') return;

    NetworkStatus.isOnline = navigator.onLine;

    window.addEventListener('online', () => {
      NetworkStatus.isOnline = true;
      NetworkStatus.notifyListeners(true);
    });

    window.addEventListener('offline', () => {
      NetworkStatus.isOnline = false;
      NetworkStatus.notifyListeners(false);
    });
  }

  static getOnline(): boolean {
    return NetworkStatus.isOnline;
  }

  static subscribe(callback: (online: boolean) => void): () => void {
    NetworkStatus.listeners.add(callback);
    callback(NetworkStatus.isOnline); // Initial call

    return () => {
      NetworkStatus.listeners.delete(callback);
    };
  }

  private static notifyListeners(online: boolean): void {
    NetworkStatus.listeners.forEach(callback => callback(online));
  }
}

// Initialize on module load
if (typeof window !== 'undefined') {
  NetworkStatus.init();
}


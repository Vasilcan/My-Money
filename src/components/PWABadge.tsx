import { useRegisterSW } from 'virtual:pwa-register/react';

export default function PWABadge() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-[80px] lg:bottom-4 left-1/2 -translate-x-1/2 z-50 animate-bounce">
      <div className="bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 w-max max-w-[90vw]">
        <div className="text-sm font-medium">
          O versiune nouă este disponibilă.
        </div>
        <div className="flex gap-2">
          <button
            className="text-xs font-bold px-4 min-h-[44px] bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl hover:bg-gray-100 dark:bg-gray-700 transition-colors"
            onClick={() => updateServiceWorker(true)}
          >
            Actualizează
          </button>
          <button
            className="text-xs font-medium px-4 min-h-[44px] text-gray-300 hover:text-white transition-colors"
            onClick={() => setNeedRefresh(false)}
          >
            Închide
          </button>
        </div>
      </div>
    </div>
  );
}

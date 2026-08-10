const Header = () => {
  return (
    <header className="bg-surface-container-lowest text-primary font-headline-md text-headline-md md:font-headline-lg md:text-headline-lg border-b border-outline-variant fixed top-0 right-0 left-0 md:left-[260px] z-50 flex justify-between items-center px-margin-desktop h-16">
      <div className="flex items-center">
        <button className="md:hidden mr-4 text-on-surface-variant" aria-label="Open menu">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="font-headline-md text-headline-md md:font-headline-lg md:text-headline-lg font-bold text-primary mr-8 hidden md:block">
          Dashboard
        </div>
      </div>
      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-outline">
            search
          </span>
          <input
            type="text"
            className="w-full text-base pl-10 pr-4 py-2 bg-surface border border-border-light rounded focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md"
            placeholder="Search orders, customers, inventory..."
          />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <button className="text-on-surface-variant hover:bg-surface-subtle transition-colors duration-200 p-2 rounded-full relative" aria-label="Notifications">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-4 right-2 w-2 h-2 bg-status-error rounded-full"></span>
        </button>
        <button className="text-on-surface-variant hover:bg-surface-subtle transition-colors duration-200 p-2 rounded-full hidden md:block" aria-label="Settings">
          <span className="material-symbols-outlined">settings</span>
        </button>
        <button className="text-on-surface-variant hover:bg-surface-subtle transition-colors duration-200 p-2 rounded-full hidden md:block" aria-label="Help">
          <span className="material-symbols-outlined">help</span>
        </button>
        <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant ml-2">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuB-vKr_iznOPthSyuqFsHXjD6EcKqfiWi-iuoMXzYDDjoWMcR_nBsh1cxXjd4Tcj_i9ekYtBfgp8boXHp4oEMC_Bn5D11UHbUCwEQa-Lp-E3N-ufnV3S3ZbLzd7UUVnifr750rnPri5hqk2t9Qr9XB_tWn-saPZqGrzE_xjv52PNN5vmkwom02WE8nXfgnOC64KuMVBnKI2myCu6sNXdckKrU2NUM06GjnEnA-CFDa4sN7XE0EvRXmOZw"
            alt="Administrator profile avatar"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </header>
  )
}

export default Header

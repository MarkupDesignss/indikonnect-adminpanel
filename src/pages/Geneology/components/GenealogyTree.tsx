import React from 'react';

export const GenealogyTree: React.FC = () => (
  <div className="lg:col-span-8 bg-surface-container-lowest border border-border-light rounded-xl overflow-hidden flex flex-col h-[600px]">
    <div className="p-4 border-b border-border-light flex justify-between items-center bg-surface-subtle">
      <h3 className="font-title-lg text-title-lg text-on-background flex items-center gap-2">
        <span className="material-symbols-outlined text-secondary-container">account_tree</span>
        Network Structure
      </h3>
      <div className="flex gap-2">
        <button className="p-1 rounded hover:bg-surface-container transition-colors text-on-surface-variant" title="Zoom In">
          <span className="material-symbols-outlined">zoom_in</span>
        </button>
        <button className="p-1 rounded hover:bg-surface-container transition-colors text-on-surface-variant" title="Zoom Out">
          <span className="material-symbols-outlined">zoom_out</span>
        </button>
        <button className="p-1 rounded hover:bg-surface-container transition-colors text-on-surface-variant" title="Reset View">
          <span className="material-symbols-outlined">fit_screen</span>
        </button>
      </div>
    </div>

    {/* Simplified Visual Tree Area */}
    <div className="flex-1 relative overflow-auto p-8 flex justify-center items-start bg-surface-subtle">
      {/* Root Node */}
      <div className="flex flex-col items-center">
        <div className="tree-node bg-primary text-on-primary border-2 border-primary-container p-3 rounded-lg shadow-sm w-48 text-center cursor-pointer hover:bg-tertiary-container transition-colors relative">
          <div className="absolute -top-3 -right-3 w-6 h-6 bg-secondary-container rounded-full flex items-center justify-center border-2 border-surface-container-lowest">
            <span className="material-symbols-outlined text-[14px] text-on-secondary-container" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
          </div>
          <div className="font-label-md text-label-md uppercase tracking-wider text-primary-fixed-dim mb-1">ID: IK-001</div>
          <div className="font-title-lg text-title-lg mb-1 truncate">Sarah Jenkins</div>
          <div className="inline-block px-2 py-0.5 rounded-full bg-status-success/20 text-status-success font-label-md text-[10px] uppercase">Active</div>
          <div className="absolute w-[2px] h-8 bg-border-light -bottom-8 left-1/2 -translate-x-1/2"></div>
          <div className="absolute w-[360px] h-[2px] bg-border-light -bottom-8 left-1/2 -translate-x-1/2"></div>
        </div>

        {/* Level 1 */}
        <div className="flex gap-16 mt-16 relative">
          {/* Node 1.1 */}
          <div className="flex flex-col items-center relative">
            <div className="absolute w-[2px] h-8 bg-border-light -top-8 left-1/2 -translate-x-1/2"></div>
            <div className="tree-node bg-surface-container-lowest text-on-surface border border-border-light p-3 rounded-lg shadow-sm w-40 text-center cursor-pointer hover:border-primary transition-all">
              <div className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant mb-1">ID: IK-104</div>
              <div className="font-body-md text-body-md font-semibold mb-1 truncate">Marcus Cole</div>
              <div className="inline-block px-2 py-0.5 rounded-full bg-status-success/10 text-status-success font-label-md text-[10px] uppercase border border-status-success/20">Active</div>
            </div>
            <div className="absolute w-[2px] h-8 bg-border-light -bottom-8 left-1/2 -translate-x-1/2"></div>
            <div className="absolute w-[120px] h-[2px] bg-border-light -bottom-8 left-1/2 -translate-x-1/2"></div>

            {/* Level 2 (under 1.1) */}
            <div className="flex gap-4 mt-16 relative">
              <div className="flex flex-col items-center relative">
                <div className="absolute w-[2px] h-8 bg-border-light -top-8 left-1/2 -translate-x-1/2"></div>
                <div className="tree-node bg-surface-container-lowest text-on-surface border border-border-light p-2 rounded w-28 text-center cursor-pointer hover:border-primary">
                  <div className="font-label-md text-[10px] text-on-surface-variant truncate">E. Rivera</div>
                  <div className="w-2 h-2 rounded-full bg-status-success mx-auto mt-1"></div>
                </div>
              </div>
              <div className="flex flex-col items-center relative">
                <div className="absolute w-[2px] h-8 bg-border-light -top-8 left-1/2 -translate-x-1/2"></div>
                <div className="tree-node bg-surface-container-lowest text-on-surface border border-border-light p-2 rounded w-28 text-center cursor-pointer hover:border-primary">
                  <div className="font-label-md text-[10px] text-on-surface-variant truncate">T. Nguyen</div>
                  <div className="w-2 h-2 rounded-full bg-status-success mx-auto mt-1"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Node 1.2 (Inactive) */}
          <div className="flex flex-col items-center relative">
            <div className="absolute w-[2px] h-8 bg-border-light -top-8 left-1/2 -translate-x-1/2"></div>
            <div className="tree-node bg-surface-container-lowest opacity-70 text-on-surface border border-border-light border-dashed p-3 rounded-lg shadow-sm w-40 text-center cursor-pointer hover:border-primary transition-all">
              <div className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant mb-1">ID: IK-109</div>
              <div className="font-body-md text-body-md font-semibold mb-1 truncate text-on-surface-variant">David Kim</div>
              <div className="inline-block px-2 py-0.5 rounded-full bg-status-error/10 text-status-error font-label-md text-[10px] uppercase border border-status-error/20">Inactive</div>
            </div>
          </div>

          {/* Node 1.3 (Selected) */}
          <div className="flex flex-col items-center relative">
            <div className="absolute w-[2px] h-8 bg-border-light -top-8 left-1/2 -translate-x-1/2"></div>
            <div className="tree-node bg-surface-container-lowest text-on-surface border border-secondary-container p-3 rounded-lg shadow-sm w-40 text-center cursor-pointer hover:border-primary transition-all relative">
              <div className="absolute -left-1 -top-1 w-2 h-2 bg-secondary-container rounded-full"></div>
              <div className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant mb-1">ID: IK-115</div>
              <div className="font-body-md text-body-md font-semibold mb-1 truncate">Aisha Patel</div>
              <div className="inline-block px-2 py-0.5 rounded-full bg-status-success/10 text-status-success font-label-md text-[10px] uppercase border border-status-success/20">Active</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

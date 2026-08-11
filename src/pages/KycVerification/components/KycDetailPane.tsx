import React from 'react';

interface KycItemDetail {
  id: number;
  name: string;
  type: string;
  submitted: string;
  status: string;
  idNumber: string;
  bizType: string;
  region: string;
  pan: string;
  registration: string;
  notes: string;
  files: any[];
}

interface Props {
  selected: KycItemDetail;
}

export const KycDetailPane: React.FC<Props> = ({ selected }) => (
  <div className="flex-1 overflow-y-auto bg-surface-subtle p-8">
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Detail Header */}
      <div className="flex justify-between items-start bg-surface-container-lowest p-6 rounded-xl border border-border-light">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-headline-md font-headline-md font-bold text-primary">
              {selected.name}
            </h2>
            <span className="px-3 py-1 rounded-full text-label-md font-label-md bg-status-warning/10 text-status-warning flex items-center gap-1 border border-status-warning/20">
              <span className="material-symbols-outlined text-[14px]">pending</span> Pending Review
            </span>
          </div>
          <div className="flex gap-6 text-data-tabular font-data-tabular text-on-surface-variant">
            <span>
              <strong className="text-on-surface">ID:</strong> {selected.idNumber}
            </span>
            <span>
              <strong className="text-on-surface">Type:</strong> {selected.bizType}
            </span>
            <span>
              <strong className="text-on-surface">Region:</strong> {selected.region}
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-2 rounded border border-border-light bg-surface-container-lowest text-status-error hover:bg-error-container/20 hover:border-status-error transition-all font-body-md font-semibold">
            Reject
          </button>
          <button className="px-6 py-2 rounded bg-primary text-on-primary hover:bg-secondary-container hover:text-secondary-fixed-dim transition-all font-body-md font-semibold">
            Approve KYC
          </button>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-8">
        {/* PAN Details */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-border-light">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-title-lg font-title-lg text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-outline">badge</span> Tax ID / PAN
            </h3>
            <button className="text-on-surface-variant hover:text-primary">
              <span className="material-symbols-outlined">fullscreen</span>
            </button>
          </div>
          <div className="mb-4">
            <label className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider block mb-1">
              Document Number
            </label>
            <div className="text-body-lg font-body-lg text-on-surface font-mono bg-surface-subtle p-2 rounded border border-border-light">
              {selected.pan}
            </div>
          </div>
          <div className="aspect-[1.6/1] bg-surface-variant rounded border border-border-light overflow-hidden relative group">
            <img
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDxxqKsvXVAIRzuqu0Ee8TMub-Gau7RRXayPwO6PpWupBNRoNLTay8MVuv3A8MdPp7iaXaRwb9AJ0UbJqbaCI7LKAoxhVozmfaxXq-nX54GrBPbKkRqkqGcJc10AWNiNmjVvV1V2BrNiKWp7-_tvPs4u2z_icF0nMVFXzWqW8MCIkx4cFsk15zb-S08_73JIr6UD3e5M_AS3z8B6GgbWQFWjvJltcRgZ9HBaj8O1mcYOyQ4DWlKuRBnv7A"
              alt="PAN card mockup"
            />
            <div className="absolute inset-0 bg-primary/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
              <button className="bg-surface-container-lowest text-primary p-2 rounded-full hover:bg-secondary-container transition-colors">
                <span className="material-symbols-outlined">zoom_in</span>
              </button>
              <button className="bg-surface-container-lowest text-primary p-2 rounded-full hover:bg-secondary-container transition-colors">
                <span className="material-symbols-outlined">download</span>
              </button>
            </div>
          </div>
        </div>

        {/* Registration / Aadhaar Details */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-border-light">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-title-lg font-title-lg text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-outline">assignment_ind</span> Registration Cert
            </h3>
          </div>
          <div className="mb-4">
            <label className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider block mb-1">
              Registration Number
            </label>
            <div className="text-body-lg font-body-lg text-on-surface font-mono bg-surface-subtle p-2 rounded border border-border-light">
              {selected.registration}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="aspect-[1.6/1] bg-surface-variant rounded border border-border-light overflow-hidden relative group">
              <img
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3oAgwHI5z-HSWccaGqZp_I7tYQD79vTxv3yrrg5V9d1cCFp9G5wg0_RgCmELC2S9rXgD7yAuHel9OlRBiHqW1Him0VuyExMaeyYi4mMiv2rTgiLri2rm8GAMXIJr7CQd5r6ox1xk5LWt68uZIo1izYwDCZeScA297uPFV9FJdxC6_M2xMNFiQK7CSlbFvPDhcK1l0dog-AEmMSU14aG9dihg_c2MIeby86HfR5QYKJaNfpcMv3jMAwA"
                alt="Registration front"
              />
              <div className="absolute inset-0 bg-primary/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button className="bg-surface-container-lowest text-primary p-1.5 rounded-full hover:bg-secondary-container transition-colors">
                  <span className="material-symbols-outlined text-[20px]">visibility</span>
                </button>
              </div>
              <div className="absolute bottom-2 left-2 bg-surface-container-lowest/90 px-2 py-0.5 rounded text-[10px] font-bold">FRONT</div>
            </div>
            <div className="aspect-[1.6/1] bg-surface-variant rounded border border-border-light overflow-hidden relative group">
              <img
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB7XTOVg4ZXAl13C6-lFlWypziK0mxV811OrDnB2837w0OTNUjkUQDJZHBzdfvYLzWOKPkgB2NV1IzWT3oWnqYML56Ry4Gv6OCOJbAU6FMUMgmWbqDOlfZgiGgT5bplVyYlwWaSMeb0tREszLO9GZ87awdDgplUUrVFnNSMrKw7uanSFzrmjZsTbJlaedit8csPlBjWEHRV_OX5up5sZYoY_ZRDxJHkR_O3sJydFRbbl_gX_1EJ-lPmsQ"
                alt="Registration back"
              />
              <div className="absolute inset-0 bg-primary/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button className="bg-surface-container-lowest text-primary p-1.5 rounded-full hover:bg-secondary-container transition-colors">
                  <span className="material-symbols-outlined text-[20px]">visibility</span>
                </button>
              </div>
              <div className="absolute bottom-2 left-2 bg-surface-container-lowest/90 px-2 py-0.5 rounded text-[10px] font-bold">BACK</div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Documents & Notes */}
      <div className="bg-surface-container-lowest p-6 rounded-xl border border-border-light">
        <h3 className="text-title-lg font-title-lg text-primary mb-4 border-b border-border-light pb-2">
          Verification Notes
        </h3>
        <div className="mb-6">
          <textarea
            className="w-full h-24 bg-surface-subtle border-border-light rounded p-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
            placeholder="Add internal review notes here. These are not visible to the applicant."
            defaultValue={selected.notes || ''}
          />
          <div className="flex justify-end mt-2">
            <button className="text-data-tabular font-data-tabular text-secondary hover:text-on-secondary-container font-semibold transition-colors">
              Save Note
            </button>
          </div>
        </div>

        <h3 className="text-title-lg font-title-lg text-primary mb-4 border-b border-border-light pb-2">
          Supporting Files
        </h3>
        <div className="flex flex-col gap-2">
          {selected.files.length > 0 ? (
            selected.files.map((file, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-3 hover:bg-surface-subtle rounded border border-transparent hover:border-border-light transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-outline">description</span>
                  <div>
                    <p className="text-data-tabular font-data-tabular text-on-surface font-semibold">
                      {file.name}
                    </p>
                    <p className="text-[11px] text-on-surface-variant">
                      {file.size} • Uploaded {file.uploaded}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="text-on-surface-variant hover:text-primary">
                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                  </button>
                  <button className="text-on-surface-variant hover:text-primary">
                    <span className="material-symbols-outlined text-[20px]">download</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-on-surface-variant text-body-md">No supporting files uploaded.</p>
          )}
        </div>
      </div>
    </div>
  </div>
);

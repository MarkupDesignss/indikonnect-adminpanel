interface ReturnEvidenceProps {
  evidence?: string[];
}

const ReturnEvidence = ({ evidence }: ReturnEvidenceProps) => {
  if (!evidence?.length) {
    return null;
  }

  return (
    <div className="bg-white rounded border border-border-light p-6">
      <div className="flex items-center gap-2 mb-4 border-b border-border-light pb-3">
        <span className="material-symbols-outlined text-outline">photo_camera</span>
        <h3 className="text-title-lg font-title-lg text-primary">Evidence Images</h3>
        <span className="ml-auto text-label-md font-label-md text-on-surface-variant">Uploaded by Distributor</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {evidence.map((image, index) => (
          <div key={image} className="aspect-video bg-surface border border-border-light rounded overflow-hidden relative group cursor-pointer">
            <img
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              src={image}
              alt={`Evidence ${index + 1}`}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-3xl">zoom_in</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReturnEvidence;

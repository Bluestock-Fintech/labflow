export default function PhotosPage() {
  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-lg font-semibold text-gray-900 mb-1">Photos</h1>
      <p className="text-sm text-gray-500 mb-4">Upload photos of your library with a title and description.</p>
      <div className="bg-white rounded-2xl border border-gray-200 border-dashed p-8 text-center">
        <p className="text-sm text-gray-500">
          Photo upload needs cloud storage (S3/R2) wired up on the backend — coming in the next pass.
        </p>
      </div>
    </div>
  );
}

export default function Custom500() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
      <div className="max-w-md">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Something went wrong</h1>
        <p className="text-gray-600 mb-6">
          An unexpected error occurred while rendering this page. Please refresh the page
          or return to the home page while we look into it.
        </p>
        <a
          href="/"
          className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-white font-medium hover:bg-red-700"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}

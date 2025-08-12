import { type Dispatch, type SetStateAction } from "react";

interface ParamsSign {
  setShowSignature: Dispatch<SetStateAction<boolean>>;
  setShowSignatureOption: Dispatch<SetStateAction<boolean>>;
}

const ShowWithSignature: React.FC<ParamsSign> = ({
  setShowSignature,
  setShowSignatureOption,
}) => {
  const choose = (withSig: boolean) => {
    setShowSignature(withSig);
  };

  return (
    <div className="w-full h-full">
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <h2 className="text-lg font-semibold mb-3">
            Include signature on the PDF?
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Choose how you want the report to appear.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                choose(false);
                setShowSignatureOption(false);
              }}
              className="px-3 py-2 rounded-lg border"
            >
              Without Signature
            </button>
            <button
              onClick={() => {
                choose(true);
                setShowSignatureOption(false);
              }}
              className="px-3 py-2 rounded-lg bg-blue-600 text-white"
            >
              With Signature
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowWithSignature;

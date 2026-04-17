import { useNavigate } from "react-router-dom";

const PaymentCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Payment Cancelled</h1>
        <p className="text-slate-600 mb-8">
          Your payment was cancelled. No charge was made. You can review the room and try again anytime.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100"
          >
            Go Back
          </button>
          <button
            onClick={() => navigate("/rooms")}
            className="px-6 py-3 rounded-lg bg-[#235784] text-white font-semibold hover:opacity-90"
          >
            Browse Rooms
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;

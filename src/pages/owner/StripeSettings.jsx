import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  getStripeKeys,
  saveStripeKeys,
  deleteStripeKeys,
} from "../../api/ownerStripe.api";

const StripeSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publicKey, setPublicKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [accountId, setAccountId] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await getStripeKeys();
        setPublicKey(res.data.publicKey || "");
        // secretKey comes masked from server, keep empty so user must re-enter to change
        setSecretKey("");
        setAccountId(res.data.accountId || "");
      } catch (err) {
        toast.error("Failed to load Stripe keys");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!publicKey || !secretKey) {
      toast.error("Public and Secret keys are required");
      return;
    }

    try {
      setSaving(true);
      await saveStripeKeys({ publicKey, secretKey, accountId });
      toast.success("Stripe keys saved");
      setSecretKey("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save keys");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Remove saved Stripe keys? This cannot be undone.")) return;
    try {
      await deleteStripeKeys();
      setPublicKey("");
      setSecretKey("");
      setAccountId("");
      toast.success("Stripe keys removed");
    } catch (err) {
      toast.error("Failed to remove keys");
    }
  };

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-white border-bottom">
        <h5 className="card-title mb-0 fw-bold">Stripe Settings</h5>
      </div>
      <div className="card-body">
        <ToastContainer />
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave}>
            <div className="mb-3">
              <label className="form-label">Publishable Key</label>
              <input
                className="form-control"
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
                placeholder="pk_live_... or pk_test_..."
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Secret Key</label>
              <input
                className="form-control"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder={
                  publicKey
                    ? "Enter secret to update (leave blank to keep)"
                    : "sk_live_... or sk_test_..."
                }
                type="password"
              />
              <div className="form-text">
                Secret is not shown for security; enter to save or update.
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">
                Connected Account ID (optional)
              </label>
              <input
                className="form-control"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="acct_..."
              />
            </div>

            <div className="d-flex gap-2">
              <button
                className="btn btn-primary"
                type="submit"
                disabled={saving}
              >
                {saving ? "Saving…" : "Save Keys"}
              </button>
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={handleDelete}
              >
                Remove Keys
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default StripeSettings;

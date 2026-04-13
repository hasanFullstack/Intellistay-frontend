import React, { useState } from "react";
import { Modal, Button, Radio, Input, Progress, Alert, Checkbox } from "antd";
import { useAuth } from "../../auth/AuthContext";
import { submitHostelEnvironment } from "../../api/hostelEnvironment.api";

const OwnerEnvironmentModal = ({ hostelId, onClose }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    socialEnvironment: "somewhat_social",
    cleanlinessStandard: "moderate",
    noiseLevelNight: "quiet",
    studyEnvironment: true,
    amenities: [],
    eventFrequency: "occasional",
    petsAllowed: false,
    visitorPolicy: "restricted_hours",
    ageGroup: "mixed",
    academicFocus: "moderate",
    maintenanceQuality: "good",
    budgetTier: "mid_range",
    nearbyNature: false,
  });

  const questions = [
    {
      id: 1,
      field: "socialEnvironment",
      question: "How would you describe the overall social vibe of your hostel?",
      type: "radio",
      options: [
        { label: "Very Social (events, active community)", value: "very_social" },
        { label: "Somewhat Social", value: "somewhat_social" },
        { label: "Quiet", value: "quiet" },
        { label: "Very Quiet", value: "very_quiet" },
      ],
    },
    {
      id: 2,
      field: "cleanlinessStandard",
      question: "How strict are cleanliness rules?",
      type: "radio",
      options: [
        { label: "Very Strict", value: "very_strict" },
        { label: "Strict", value: "strict" },
        { label: "Moderate", value: "moderate" },
        { label: "Relaxed", value: "relaxed" },
      ],
    },
    {
      id: 3,
      field: "noiseLevelNight",
      question: "What is the typical noise level at night?",
      type: "radio",
      options: [
        { label: "Very Quiet", value: "very_quiet" },
        { label: "Quiet", value: "quiet" },
        { label: "Moderate", value: "moderate" },
        { label: "Party Zone", value: "party_zone" },
      ],
    },
    {
      id: 4,
      field: "studyEnvironment",
      question: "Is your hostel suitable for serious study?",
      type: "radio",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    {
      id: 5,
      field: "amenities",
      question: "Which amenities do you offer?",
      type: "checkbox",
      options: [
        { label: "High-Speed WiFi", value: "WiFi" },
        { label: "Study Room", value: "Study Room" },
        { label: "Gym", value: "Gym" },
        { label: "Laundry", value: "Laundry" },
        { label: "AC Rooms", value: "AC Rooms" },
        { label: "Common Lounge", value: "Common Lounge" },
        { label: "Kitchen Access", value: "Kitchen Access" },
        { label: "Security 24/7", value: "Security" },
      ],
    },
    {
      id: 6,
      field: "eventFrequency",
      question: "How often do you organize events or activities?",
      type: "radio",
      options: [
        { label: "Frequent", value: "frequent" },
        { label: "Occasional", value: "occasional" },
        { label: "Rare", value: "rare" },
        { label: "None", value: "none" },
      ],
    },
    {
      id: 7,
      field: "petsAllowed",
      question: "Are pets allowed?",
      type: "radio",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    {
      id: 8,
      field: "visitorPolicy",
      question: "What is your visitor policy?",
      type: "radio",
      options: [
        { label: "Open", value: "open" },
        { label: "Restricted Hours", value: "restricted_hours" },
        { label: "Restricted Days", value: "restricted_days" },
        { label: "No Visitors", value: "no_visitors" },
      ],
    },
    {
      id: 9,
      field: "ageGroup",
      question: "What age group mostly stays here?",
      type: "radio",
      options: [
        { label: "18–20", value: "18-20" },
        { label: "20–22", value: "20-22" },
        { label: "22–24", value: "22-24" },
        { label: "Mixed", value: "mixed" },
      ],
    },
    {
      id: 10,
      field: "academicFocus",
      question: "How academically focused is your hostel environment?",
      type: "radio",
      options: [
        { label: "Very High", value: "very_high" },
        { label: "High", value: "high" },
        { label: "Moderate", value: "moderate" },
        { label: "Low", value: "low" },
      ],
    },
    {
      id: 11,
      field: "maintenanceQuality",
      question: "How would you rate your maintenance quality?",
      type: "radio",
      options: [
        { label: "Excellent", value: "excellent" },
        { label: "Good", value: "good" },
        { label: "Average", value: "average" },
        { label: "Poor", value: "poor" },
      ],
    },
    {
      id: 12,
      field: "budgetTier",
      question: "What pricing tier does your hostel fall into?",
      type: "radio",
      options: [
        { label: "Luxury", value: "luxury" },
        { label: "Premium", value: "premium" },
        { label: "Mid Range", value: "mid_range" },
        { label: "Budget", value: "budget" },
      ],
    },
    {
      id: 13,
      field: "nearbyNature",
      question: "Is your hostel near parks or natural areas?",
      type: "radio",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
  ];

  const totalSteps = questions.length;
  const currentQuestion = questions[step - 1];

  const handleOptionSelect = (id, value) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
    setError("");
  };

  const handleNext = () => {
    const q = currentQuestion;
    const val = formData[q.field];
    // validation per type
    if (q.type === "checkbox") {
      if (!Array.isArray(val) || val.length === 0) {
        setError("Please select at least one option before proceeding");
        return;
      }
    } else if (q.type === "radio") {
      if (val === undefined || val === null || val === "") {
        setError("Please select an option before proceeding");
        return;
      }
    }
    if (step < totalSteps) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const { user } = useAuth();

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      if (!hostelId) {
        setError("Hostel ID is missing. Please reopen the modal from the hostel page.");
        setLoading(false);
        return;
      }
      const environmentProfile = {
        ...formData,
        amenities: Array.isArray(formData.amenities)
          ? formData.amenities
          : formData.amenities
          ? formData.amenities.split(",").map((a) => a.trim())
          : [],
      };
      const ownerId = user?._id || user?.id || null;
      await submitHostelEnvironment(hostelId, ownerId, environmentProfile);
      Modal.success({ title: "Saved", content: "Hostel environment profile saved." });
      if (onClose) onClose(true);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save profile.");
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
      <Button onClick={handlePrev} disabled={step === 1}>← Previous</Button>
      {step < totalSteps ? (
        <Button type="primary" onClick={handleNext}>Next →</Button>
      ) : (
        <Button type="primary" onClick={handleSubmit} loading={loading}>Save Profile</Button>
      )}
    </div>
  );

  return (
    <Modal
      open={true}
      centered
      onCancel={() => onClose && onClose(false)}
      footer={footer}
      width={900}
      maskClosable={false}
      destroyOnClose
    >
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 12 }} />}

      <div style={{ marginBottom: 12 }}>
        <Progress percent={Math.round((step / totalSteps) * 100)} showInfo={false} strokeWidth={8} />
        <p style={{ marginTop: 8 }}>Question {step} of {totalSteps}</p>
      </div>

      <div>
        <h4>{currentQuestion.question}</h4>

        {currentQuestion.type === "text" ? (
          <Input
            value={formData[currentQuestion.field]}
            onChange={(e) => handleOptionSelect(currentQuestion.field, e.target.value)}
            placeholder="Comma-separated, e.g., WiFi, Kitchen, AC"
          />
        ) : currentQuestion.type === "checkbox" ? (
          <Checkbox.Group
            options={currentQuestion.options}
            value={formData[currentQuestion.field]}
            onChange={(vals) => handleOptionSelect(currentQuestion.field, vals)}
          />
        ) : (
          <Radio.Group
            onChange={(e) => handleOptionSelect(currentQuestion.field, e.target.value)}
            value={formData[currentQuestion.field]}
          >
            {currentQuestion.options.map((opt) => (
              <div key={String(opt.value)} style={{ marginBottom: 8 }}>
                <Radio value={opt.value}>{opt.label}</Radio>
              </div>
            ))}
          </Radio.Group>
        )}
      </div>
    </Modal>
  );
};

export default OwnerEnvironmentModal;


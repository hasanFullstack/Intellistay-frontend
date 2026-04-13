import { useState } from "react";
import { submitPersonalityQuiz } from "../src/api/personality.api";
import "./PersonalityQuiz.css";

const PersonalityQuiz = ({ userId, onComplete, onClose }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    eveningRoutine: "",
    weekendStyle: "",
    sharedSpaceReaction: "",
    noiseDuringFocus: "",
    sleepPattern: "",
    guestComfort: "",
    conflictApproach: "",
    dailyRoutine: "",
    focusEnvironment: "",
    sharedRoomComfort: "",
    locationPreference: "",
    budgetPriority: "",
    facilityInterest: "",
    petPreference: "",
  });

  const totalSteps = 14; // One step per question

  const questions = [
    {
      id: "eveningRoutine",
      title: "After a long day, you usually:",
      options: [
        { value: "hangout_group", label: "Spend time with friends or roommates" },
        { value: "small_group", label: "Talk with 1–2 close people" },
        { value: "relax_alone", label: "Relax alone with phone, book, or movie" },
        { value: "productive_time", label: "Focus on personal work or goals" },
      ],
    },

    {
      id: "weekendStyle",
      title: "Your ideal weekend looks like:",
      options: [
        { value: "social_outings", label: "Going out or attending gatherings" },
        { value: "balanced_mix", label: "Mix of social time and relaxing" },
        { value: "quiet_indoor", label: "Mostly relaxing indoors" },
        { value: "goal_oriented", label: "Catching up on studies or tasks" },
      ],
    },

    {
      id: "sharedSpaceReaction",
      title: "If common areas are slightly untidy, you usually:",
      options: [
        { value: "clean_immediately", label: "Clean it before using" },
        { value: "clean_my_part", label: "Use it and clean my part only" },
        { value: "ignore_small_mess", label: "Ignore minor mess and continue" },
        { value: "not_bothered", label: "It doesn’t really affect me" },
      ],
    },

    {
      id: "noiseDuringFocus",
      title: "When you're resting or focusing and there's background noise, you:",
      options: [
        { value: "easily_disturbed", label: "Get distracted quickly" },
        { value: "notice_manage", label: "Notice it but manage" },
        { value: "barely_notice", label: "Barely notice it" },
        { value: "not_affected", label: "Are not affected at all" },
      ],
    },

    {
      id: "sleepPattern",
      title: "On most days, you:",
      options: [
        { value: "sleep_early", label: "Sleep before 11 PM" },
        { value: "sleep_midnight", label: "Sleep between 11 PM – 1 AM" },
        { value: "sleep_late", label: "Sleep after 1 AM" },
        { value: "irregular_sleep", label: "Have no fixed sleep schedule" },
      ],
    },

    {
      id: "guestComfort",
      title: "If your roommate invites friends over, you:",
      options: [
        { value: "prefer_notice", label: "Prefer being informed beforehand" },
        { value: "occasionally_okay", label: "Are fine once in a while" },
        { value: "comfortable_with_it", label: "Are generally comfortable" },
        { value: "enjoy_company", label: "Enjoy having people around" },
      ],
    },

    {
      id: "conflictApproach",
      title: "If a small issue happens with a roommate, you usually:",
      options: [
        { value: "discuss_directly", label: "Talk about it directly" },
        { value: "wait_observe", label: "Wait and see if it improves" },
        { value: "avoid_topic", label: "Avoid discussing it" },
        { value: "adjust_myself", label: "Adjust yourself instead" },
      ],
    },

    {
      id: "dailyRoutine",
      title: "Your daily routine is mostly:",
      options: [
        { value: "structured_planned", label: "Planned and structured" },
        { value: "semi_structured", label: "Planned but flexible" },
        { value: "go_with_flow", label: "Go with the flow" },
        { value: "very_spontaneous", label: "Spontaneous and unpredictable" },
      ],
    },

    {
      id: "focusEnvironment",
      title: "When you have an important deadline, you prefer:",
      options: [
        { value: "private_quiet_space", label: "A quiet private space" },
        { value: "library_environment", label: "Library or study hall" },
        { value: "any_comfortable_spot", label: "Any comfortable place" },
        { value: "last_minute_style", label: "Work closer to the deadline" },
      ],
    },

    {
      id: "sharedRoomComfort",
      title: "In shared accommodation, what matters most?",
      options: [
        { value: "personal_space", label: "Having personal space respected" },
        { value: "clear_routines", label: "Clear understanding of routines" },
        { value: "friendly_environment", label: "Friendly and interactive vibe" },
        { value: "flexible_arrangement", label: "Flexibility and freedom" },
      ],
    },

    {
      id: "locationPreference",
      title: "Which type of area would suit you best?",
      options: [
        { value: "urban_lively", label: "Busy and lively area" },
        { value: "near_campus_or_office", label: "Close to university or offices" },
        { value: "quiet_residential", label: "Calm residential neighborhood" },
        { value: "flexible_location", label: "Open to different areas" },
      ],
    },

    {
      id: "budgetPriority",
      title: "When choosing accommodation, what matters most?",
      options: [
        { value: "premium_comfort", label: "Premium comfort and amenities" },
        { value: "balanced_quality", label: "Good quality at reasonable cost" },
        { value: "affordable_pricing", label: "Affordable pricing" },
        { value: "basic_essentials", label: "Just basic essentials" },
      ],
    },

    {
      id: "facilityInterest",
      title: "Which facility would improve your stay the most?",
      options: [
        { value: "fitness_facilities", label: "Gym or sports facilities" },
        { value: "entertainment_space", label: "Gaming or entertainment areas" },
        { value: "quiet_study_space", label: "Dedicated quiet study rooms" },
        { value: "minimal_needs", label: "I only need basic facilities" },
      ],
    },

    {
      id: "petPreference",
      title: "Living in a pet-friendly place:",
      options: [
        { value: "love_pets", label: "Sounds great" },
        { value: "okay_with_pets", label: "Is fine with me" },
        { value: "neutral_about_pets", label: "Doesn’t matter much" },
        { value: "prefer_no_pets", label: "I prefer no pets around" },
      ],
    },
  ];

  const currentQuestion = questions[step - 1];

  const handleOptionSelect = (value) => {
    setFormData({
      ...formData,
      [currentQuestion.id]: value,
    });
  };

  const handleNext = () => {
    // Check if current question is answered before moving to next
    if (!formData[currentQuestion.id]) {
      alert("Please select an option before proceeding");
      return;
    }
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    // Check if all questions are answered
    const unanswered = questions.filter((q) => !formData[q.id]);
    if (unanswered.length > 0) {
      alert("Please answer all questions before submitting");
      return;
    }

    setLoading(true);
    try {
      const response = await submitPersonalityQuiz(formData);
      console.log("Quiz submitted successfully:", response.data);
      alert(
        "Personality quiz submitted! We'll use this to find the perfect hostel for you.",
      );
      // Pass updated user with quizCompleted flag
      const updatedUser = { ...response.data.user, quizCompleted: true };
      onComplete(updatedUser);
    } catch (error) {
      console.error("Full error object:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error message:", error.message);
      const errorMsg = error.response?.data?.message || error.message || "Something went wrong";
      alert(`Error submitting quiz: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="personality-quiz-overlay">
      <div className="personality-quiz-modal">
        <div className="quiz-header">
          <h2>📋 Student Personality Quiz</h2>
          <button className="quiz-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="quiz-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            ></div>
          </div>
          <p className="progress-text">
            Question {step} of {totalSteps}
          </p>
        </div>

        <div className="quiz-content">
          <div className="quiz-question">
            <h3>{currentQuestion.title}</h3>

            <div className="quiz-options">
              {currentQuestion.options.map((option) => (
                <label key={option.value} className="quiz-option">
                  <input
                    type="radio"
                    name={currentQuestion.id}
                    value={option.value}
                    checked={formData[currentQuestion.id] === option.value}
                    onChange={() => handleOptionSelect(option.value)}
                  />
                  <span className="option-label">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="quiz-footer">
          <button
            className="btn btn--secondary"
            onClick={handlePrev}
            disabled={step === 1}
          >
            ← Previous
          </button>

          <div className="quiz-buttons">
            {step < totalSteps && (
              <button className="btn btn--primary" onClick={handleNext}>
                Next →
              </button>
            )}
            {step === totalSteps && (
              <button
                className="btn btn--success"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit Quiz"}
              </button>
            )}
          </div>
        </div>

        <div className="quiz-info">
          <p>
            💡 This quiz helps us understand your preferences and recommend the
            best hostels for you!
          </p>
        </div>
      </div>
    </div>
  );
};

export default PersonalityQuiz;

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";

import { StudioOnboardingOverlay } from "@/components/studio/onboarding/studio-onboarding-overlay";
import { useMeQuery } from "@/hooks/queries/auth";
import { useYouganStreamContextOptional } from "@/components/studio/yougan-stream-provider";
import { requestCreativeContextDrawerOpen } from "@/lib/studio-drawer-events";
import {
  shouldAutoStartStudioOnboarding,
  STUDIO_ONBOARDING_STEPS,
  STUDIO_ONBOARDING_VERSION,
  writeStudioOnboardingRecord,
  type StudioOnboardingStep,
} from "@/lib/studio-onboarding";

const GUIDE_VISITED_KEY = "yougan:guide-visited-this-session";
const AUTO_START_DELAY_MS = 500;

type StudioOnboardingContextValue = {
  isActive: boolean;
  stepIndex: number;
  currentStepId: StudioOnboardingStep["id"] | null;
  highlightRevisitEntry: boolean;
  steps: StudioOnboardingStep[];
  startTour: (options?: { skipWelcome?: boolean }) => void;
  dismissTour: () => void;
};

const StudioOnboardingContext =
  createContext<StudioOnboardingContextValue | null>(null);

function markGuideVisitedThisSession() {
  sessionStorage.setItem(GUIDE_VISITED_KEY, "1");
}

function hasVisitedGuideThisSession() {
  return sessionStorage.getItem(GUIDE_VISITED_KEY) === "1";
}

export function StudioOnboardingProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { data: user } = useMeQuery();
  const studioContext = useYouganStreamContextOptional();
  const [isActive, setIsActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const autoStartAttemptedRef = useRef(false);
  const onStudioPage = pathname.startsWith("/studio");

  useEffect(() => {
    if (pathname === "/features") {
      markGuideVisitedThisSession();
    }
  }, [pathname]);

  const persistRecord = useCallback(
    (status: "completed" | "dismissed") => {
      if (!user?.id) return;
      writeStudioOnboardingRecord(user.id, {
        version: STUDIO_ONBOARDING_VERSION,
        status,
        dismissedAtStep: status === "dismissed" ? stepIndex + 1 : undefined,
        updatedAt: new Date().toISOString(),
      });
    },
    [stepIndex, user?.id],
  );

  const closeTour = useCallback(
    (status: "completed" | "dismissed") => {
      persistRecord(status);
      setIsActive(false);
      setStepIndex(0);
    },
    [persistRecord],
  );

  const dismissTour = useCallback(() => {
    closeTour("dismissed");
  }, [closeTour]);

  const startTour = useCallback(
    (options?: { skipWelcome?: boolean }) => {
      setStepIndex(options?.skipWelcome ? 1 : 0);
      setIsActive(true);
    },
    [],
  );

  const goNext = useCallback(() => {
    if (stepIndex >= STUDIO_ONBOARDING_STEPS.length - 1) {
      closeTour("completed");
      return;
    }
    setStepIndex((current) => current + 1);
  }, [closeTour, stepIndex]);

  const currentStep = isActive ? STUDIO_ONBOARDING_STEPS[stepIndex] : null;

  useEffect(() => {
    if (!currentStep || currentStep.kind !== "spotlight") return;
    if (!currentStep.ensureDrawerOpen) return;
    requestCreativeContextDrawerOpen();
  }, [currentStep]);

  const canAutoStart = useMemo(() => {
    if (!onStudioPage || !user?.id) return false;
    if (!shouldAutoStartStudioOnboarding(user.id)) return false;
    if (studioContext?.loading) return false;
    if (studioContext?.stream.isLoading) return false;
    if (studioContext?.productionConfirmInterrupt) return false;
    if (studioContext?.reviseConfirmInterrupt) return false;
    return true;
  }, [
    onStudioPage,
    studioContext?.loading,
    studioContext?.productionConfirmInterrupt,
    studioContext?.reviseConfirmInterrupt,
    studioContext?.stream.isLoading,
    user?.id,
  ]);

  useEffect(() => {
    if (!canAutoStart || autoStartAttemptedRef.current || isActive) return;

    const timer = window.setTimeout(() => {
      autoStartAttemptedRef.current = true;
      startTour({ skipWelcome: hasVisitedGuideThisSession() });
    }, AUTO_START_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [canAutoStart, isActive, startTour]);

  const value = useMemo(
    () => ({
      isActive,
      stepIndex,
      currentStepId: currentStep?.id ?? null,
      highlightRevisitEntry: currentStep?.id === "works-aside",
      steps: STUDIO_ONBOARDING_STEPS,
      startTour,
      dismissTour,
    }),
    [currentStep?.id, dismissTour, isActive, startTour, stepIndex],
  );

  return (
    <StudioOnboardingContext.Provider value={value}>
      {children}
      {isActive && currentStep ? (
        <StudioOnboardingOverlay
          step={currentStep}
          stepIndex={stepIndex}
          stepCount={STUDIO_ONBOARDING_STEPS.length}
          onNext={goNext}
          onDismiss={dismissTour}
        />
      ) : null}
    </StudioOnboardingContext.Provider>
  );
}

export function useStudioOnboarding() {
  const context = useContext(StudioOnboardingContext);
  if (!context) {
    throw new Error(
      "useStudioOnboarding must be used within StudioOnboardingProvider",
    );
  }
  return context;
}

export function useStudioOnboardingOptional() {
  return useContext(StudioOnboardingContext);
}

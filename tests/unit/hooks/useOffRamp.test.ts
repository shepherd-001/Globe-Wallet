/** @jest-environment jsdom */
import { renderHook, act, waitFor } from "@testing-library/react";
import { useOffRamp } from "@/hooks/useOffRamp";

const ACH_METHOD = {
  id: "bank_1",
  type: "bank" as const,
  name: "Chase Checking ****1234",
  details: "ACH Transfer",
  fees: "1.5%",
  processingTime: "1-3 business days",
  limits: { min: 10, max: 10000 },
  enabled: true,
};

describe("useOffRamp", () => {
  beforeEach(() => {
    window.localStorage.clear();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("initializes with empty form state", () => {
    const { result } = renderHook(() => useOffRamp({ methods: [ACH_METHOD] }));

    expect(result.current.amount).toBe("");
    expect(result.current.asset).toBe("XLM");
    expect(result.current.paymentMethodId).toBe("");
    expect(result.current.isLoading).toBe(false);
    expect(result.current.backendError).toBeNull();
    expect(result.current.lastWithdrawal).toBeNull();
    expect(result.current.breakdown).toBeNull();
    expect(result.current.validation.valid).toBe(false);
  });

  it("rehydrates payment method and last withdrawal from localStorage", async () => {
    window.localStorage.setItem("globe-offramp-selected-method", "bank_1");
    window.localStorage.setItem(
      "globe-offramp-last-withdrawal",
      JSON.stringify({
        methodId: "bank_1",
        methodName: "Chase",
        asset: "XLM",
        amount: 110,
        fiatAmount: 10.45,
        status: "completed",
        date: "2026-01-01T00:00:00.000Z",
      }),
    );

    const { result } = renderHook(() => useOffRamp({ methods: [ACH_METHOD] }));

    await waitFor(() => {
      expect(result.current.paymentMethodId).toBe("bank_1");
      expect(result.current.lastWithdrawal?.amount).toBe(110);
    });
  });

  it("removes invalid stored withdrawal JSON", async () => {
    window.localStorage.setItem("globe-offramp-last-withdrawal", "{not-json");

    renderHook(() => useOffRamp({ methods: [ACH_METHOD] }));

    await waitFor(() => {
      expect(window.localStorage.getItem("globe-offramp-last-withdrawal")).toBeNull();
    });
  });

  it("updates form fields, validation, and breakdown", () => {
    const { result } = renderHook(() => useOffRamp({ methods: [ACH_METHOD] }));

    act(() => {
      result.current.setPaymentMethod("bank_1");
      result.current.setAmount("110");
      result.current.setAsset("XLM");
    });

    expect(result.current.validation.valid).toBe(true);
    expect(result.current.breakdown?.usdValue).toBeCloseTo(10.45);
    expect(window.localStorage.getItem("globe-offramp-selected-method")).toBe("bank_1");
  });

  it("sets max amount from balances", () => {
    const { result } = renderHook(() =>
      useOffRamp({
        methods: [ACH_METHOD],
        balances: { XLM: 500, USDC: 100 },
      }),
    );

    act(() => {
      result.current.setAsset("XLM");
      result.current.setMaxAmount();
    });

    expect(result.current.amount).toBe("500");
  });

  it("clears backend errors", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, error: "Insufficient funds" }),
    });

    const { result } = renderHook(() => useOffRamp({ methods: [ACH_METHOD] }));

    act(() => {
      result.current.setPaymentMethod("bank_1");
      result.current.setAmount("110");
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.backendError).toBe("Insufficient funds");

    act(() => {
      result.current.clearError();
    });

    expect(result.current.backendError).toBeNull();
  });

  it("does not submit when validation fails", async () => {
    const { result } = renderHook(() => useOffRamp({ methods: [ACH_METHOD] }));

    await act(async () => {
      await result.current.submit();
    });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it("submits a valid withdrawal and persists the result", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          methodId: "bank_1",
          methodName: "Chase Checking ****1234",
          asset: "XLM",
          amount: 110,
          fiatAmount: 10.45,
          status: "completed",
          hash: "0xabc",
        },
      }),
    });

    const { result } = renderHook(() => useOffRamp({ methods: [ACH_METHOD] }));

    act(() => {
      result.current.setPaymentMethod("bank_1");
      result.current.setAmount("110");
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/off-ramp",
      expect.objectContaining({ method: "POST" }),
    );
    expect(result.current.amount).toBe("");
    expect(result.current.lastWithdrawal?.hash).toBe("0xabc");
    expect(window.localStorage.getItem("globe-offramp-last-withdrawal")).toContain("0xabc");
    expect(result.current.isLoading).toBe(false);
  });

  it("handles network failures during submit", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network loss"));

    const { result } = renderHook(() => useOffRamp({ methods: [ACH_METHOD] }));

    act(() => {
      result.current.setPaymentMethod("bank_1");
      result.current.setAmount("110");
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.backendError).toBe("Network loss");
    expect(result.current.isLoading).toBe(false);
  });
});

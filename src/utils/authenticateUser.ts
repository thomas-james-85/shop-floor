export const authenticateUser = async (
  employeeId: string,
  roleRequired:
    | "can_operate"
    | "can_setup"
    | "can_inspect"
    | "can_remanufacture"
): Promise<{ success: boolean; name?: string; error?: string }> => {
  try {
    const response = await fetch("/api/users/authenticate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employee_id: employeeId,
        role_required: roleRequired,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error };
    }

    return { success: true, name: data.name };
  } catch (error) {
    console.error("Authentication Error:", error);
    return { success: false, error: "Server error" };
  }
};

"use server";

// Обработка заявки "В команду"
export async function sendJoinTeamAction(data: { [k: string]: FormDataEntryValue }) {
  console.log("Получена заявка в команду:", data);
  
  // Имитация задержки сети
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Возвращаем успех
  return { success: true };
}
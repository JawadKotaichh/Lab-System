import api from "../../api";

const handleDeleteVisit = async (visit_id: string) => {
  try {
    await api.delete(`/visits/${visit_id}`);
    window.location.reload();
  } catch (err) {
    if (err instanceof Error) {
      console.log(err.message);
    }
  }
};
export default handleDeleteVisit;

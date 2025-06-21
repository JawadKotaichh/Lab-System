import api from "../../../api";

const handleDeleteVisit = async (visit_id: string) => {
  try {
    await api.delete(`/visits/${visit_id}`);
  } catch (err) {
    if (err instanceof Error) {
      console.log(err.message);
    }
  }
};
export default handleDeleteVisit;

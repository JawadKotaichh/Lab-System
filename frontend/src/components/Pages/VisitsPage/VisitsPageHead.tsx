const VisitsPageHead: React.FC = () => (
  <thead className="bg-gray-100 border-b border-black sticky top-0 z-10 items-center">
    <tr>
      <th className="border px-4 py-2">Visit Date</th>
      <th className="border px-4 py-2">Patient Name</th>
      <th className="border px-4 py-2">Insurance Company</th>
      <th className="border px-4 py-2">Total Price</th>
      <th className="border px-4 py-2">Completed Results/Total</th>
      <th className="border px-4 py-2">Preview Result</th>
      <th className="border px-4 py-2">Edit Visit</th>
      <th className="border px-4 py-2">Delete Visit</th>
    </tr>
  </thead>
);
export default VisitsPageHead;

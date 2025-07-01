
const PatientListHead: React.FC = () =>(
    <thead className="bg-gray-100 border-b border-black sticky top-0 z-10">        
        <tr>                                
            <th className="h-8 px-0 py-2">Id</th>
            <th className="h-8 px-0 py-2">Name</th>
            <th className="h-8 px-0 py-2">Gender</th>
            <th className="h-8 px-0 py-2">DOB</th>
            <th className="h-8 px-0 py-2">Insurance Company</th>
            <th className="h-8 px-0 py-2">Phone Number</th>
            <th className="h-8 px-0 py-2">New Visit</th>
            <th className="h-8 px-0 py-2">Edit Patient</th>
        </tr>
    </thead>
    
)
export default PatientListHead;
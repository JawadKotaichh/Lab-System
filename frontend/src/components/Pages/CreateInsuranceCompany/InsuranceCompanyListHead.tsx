import { tableHead, tableHeadCols } from "../../../style";

const InsuranceCompanyListHead: React.FC = () =>(
    <thead className={tableHead}>        
        <tr>                                
            <th className={tableHeadCols}>Insurance Company Name</th>
            <th className={tableHeadCols}>Rate</th>
            <th className={tableHeadCols}>Edit insutance company</th>
        </tr>
    </thead>
    
)
export default InsuranceCompanyListHead;
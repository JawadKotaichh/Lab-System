import { useEffect, useState } from "react";
import api from "../../../api";
import { useNavigate, useParams } from "react-router-dom";
import { inputForm, inputFormAttributeList, inputFormAttributeListItem, inputFormAttributeListItemInput, inputFormAttributeListItemLabel, inputFormSave, inputFormTitle, stateStyle } from "../../../style";
import type { CreateInsuranceCompanyParams, InsuranceCompanyCreatePageParams } from "../../types";
import { DollarSign, User } from "lucide-react";
import { fetchInsuranceCompany } from "../../utils";


        

const CreateInsuranceCompanyComponent = ({apiURL,listOfAttributes,title,pageUrL}:InsuranceCompanyCreatePageParams) =>{
    const [state,setState] = useState<string>("");
    const navigate = useNavigate();
    const { insurance_company_id } = useParams();
    const [data, setData] = useState<CreateInsuranceCompanyParams>({
        insurance_company_name:"",
        rate:""
    });
    console.log(insurance_company_id);
    useEffect(() => {
        if (insurance_company_id) {
            fetchInsuranceCompany(insurance_company_id)
                .then((d) => setData(d))
                .catch(err => {
                    console.error("Failed to fetch insurance company data:", err);
                    setState("Failed to load insurance company data");
                });
        }
    }, [insurance_company_id]);
    console.log(data);
    
    const handleInputChange = ({attributeName,value}:{attributeName:string,value:string})=>{
        setData(prev =>({
            ...prev,[attributeName]:value
        }));
    }
    const handleSave = async ()=>{
        if( data.insurance_company_name=="" || data.rate==""){
            setState("Please insert all the reuqired fields!");
            return;
        }
        try{
            if(insurance_company_id){
                apiURL=apiURL+insurance_company_id;
                console.log(apiURL)
            }
            api.post(apiURL,data);
            navigate(pageUrL)
        }catch(err){
            if(err instanceof Error){
                console.log(err.message);
            }
        }
    };
    const renderIcon = (iconName: string) => {
        switch (iconName.toLowerCase()) {
            case "dollarsign":
                return <DollarSign className="w-4 h-4 text-gray-500" />;
            case "user":
                return <User className="w-4 h-4 text-gray-500" />;
            default:
                return null;
        }
    };
    return (
        
        <div className={inputForm}>
            <h1 className={inputFormTitle}>{title}</h1>
            <div className={inputFormAttributeList}>
                {listOfAttributes.map(i=>(
                    <div className={inputFormAttributeListItem}>
                        <label className={inputFormAttributeListItemLabel}>
                            {renderIcon(i.icon)}
                            <span>{i.subItem}</span>
                        </label>
                        <input
                            className={inputFormAttributeListItemInput}
                            type={i.typeOfInput}
                            value={data[i.attributeName as keyof CreateInsuranceCompanyParams] || ""}
                            placeholder={i.placeHolder}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.currentTarget.blur();
                            }}}
                            onChange={(e) => handleInputChange({attributeName:i.attributeName,value:e.target.value})}>
                            
                        </input>
                    </div>

                ))}
            </div> 
        
        <button 
        className={inputFormSave}
        onClick={()=>handleSave()}
        >
            Save
        </button>
        <h1 className={stateStyle}>{state}</h1>
        </div>
    )

};
export default CreateInsuranceCompanyComponent;

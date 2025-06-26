import { useState } from "react";
import api from "../../../api";
import { useNavigate } from "react-router-dom";
import { inputForm, inputFormAttributeList, inputFormAttributeListItem, inputFormAttributeListItemInput, inputFormAttributeListItemLabel, inputFormSave, inputFormTitle } from "../../../style";



export interface CreateItemParams<T>{
    initialValue:T;
    apiURL:string;

    title:string;
  listOfAttributes:attributesParams[];
};
// insurance companies
// lab test type / lab test group
// patient


const CreateItemPage = <T,> ({listOfAttributes,initialValue,apiURL,title}:CreateItemParams<T>) =>{
    const navigate = useNavigate();
    const [data, setData] = useState<T>(initialValue);
    
    const handleInputChange = ({attributeName,value}:{attributeName:string,value:string})=>{
        setData(prev =>({
            ...prev,[attributeName]:value
        }));
    }
    const handleSave = async ()=>{
        try{
            api.post(apiURL,data);
            navigate("/visits")
        }catch(err){
            if(err instanceof Error){
                console.log(err.message);
            }
        }
    };
    return (
        <div className={inputForm}>
            <h1 className={inputFormTitle}>{title}</h1>
            <div className={inputFormAttributeList}>
                {listOfAttributes.map(i=>(
                    <div className={inputFormAttributeListItem}>
                        <label className={inputFormAttributeListItemLabel}>
                            <span>{i.subItem}</span>
                        </label>
                        <input
                            className={inputFormAttributeListItemInput}
                            type={i.typeOfInput}
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
        onClick={()=>handleSave()}>
            Save
        </button>
        </div>
    )

};
export default CreateItemPage;
import CreateInsuranceCompanyComponent from "./CreateInsuranceCompanyComponent";

const CreateInsuranceCompanyPage = () =>{
    const listOfAttributes =
        [
            {
                subItem:"Name",
                attributeName:"insurance_company_name",
                typeOfInput:"string",
                icon:"User",
                placeHolder:"Enter insurance company name"
            },
            {
                subItem:"Rate",
                attributeName:"rate",
                typeOfInput:"number",
                icon:"DollarSign",
                placeHolder:"Enter insurance company rate"
            },
        ];
    const apiURL = "/insurance_company/";
    const title = "Create Insurance Comopany";
    const pageUrL = "/insurance-companies";
    return (
        
        <div>
            <CreateInsuranceCompanyComponent
            title={title}
            pageUrL={pageUrL}
            listOfAttributes={listOfAttributes}
            apiURL={apiURL}/>
        </div>
    )

};
export default CreateInsuranceCompanyPage;

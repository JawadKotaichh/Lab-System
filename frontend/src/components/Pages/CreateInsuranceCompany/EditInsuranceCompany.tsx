import CreateInsuranceCompanyComponent from "./CreateInsuranceCompanyComponent";

const EditInsuranceCompany = () =>{
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
    const title = "Edit Insurance Company";
    const pageUrL = "/insurance-companies";
    
    console.log("I am in the edit page");


    return(
        <CreateInsuranceCompanyComponent
        listOfAttributes = {listOfAttributes}
        apiURL={apiURL}
        title={title}
        pageUrL={pageUrL}
        />
    )
};
export default EditInsuranceCompany;
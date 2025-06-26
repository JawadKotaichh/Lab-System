import CreateItemPage from "./CreateItemPage";

const CreatePatient = () => {
    const listOfAttributes =
        [
            {
                subItem:"Patient Name",
                dbName:"name",
                typeOfInput:"string",
                placeHolder:"Enter patient name"
            },
            {
                subItem:"DOB",
                dbName:"",
                typeOfInput:"date",
                placeHolder:"Enter DOB of the patient"
            },
            {
                subItem:"Gender",
                dbName:"gender",
                typeOfInput:"string",
                placeHolder:"Enter insurance company rate"
            },
            {
                subItem:"Phone Number",
                dbName:"phone_number",
                typeOfInput:"string",
                placeHolder:"Enter patient phone number"
            },
            {
                subItem:"Insurance Company",
                dbName:"insurance_company_id",
                typeOfInput:"Selection",
                placeHolder:"Choose insurance company"
            },
        ];
    const type = "Patient";
    return(
        <CreateItemPage
        listOfAttributes={listOfAttributes}
        type={type}
        >
            
        </CreateItemPage>
    )
};
export default CreatePatient;
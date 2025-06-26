import ShowInsuranceCompanyList from "./ShowInsuranceCompanyList";

const MainInsuranceCompanyPage = () => {
  return (
    <div>
      <ShowInsuranceCompanyList
        editPageURL="/edit-insurance-company/"
        apiURL="/insurance_company"
        createPageURL="/create-insurance-company"
      />
    </div>
  );
};
export default MainInsuranceCompanyPage;

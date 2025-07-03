import type { labTest } from "../types";

interface SearchForATest {
  searchInput: string;
  allTests: labTest[];
  setSearchInput: React.Dispatch<React.SetStateAction<string>>;
  setVisibleTests: React.Dispatch<React.SetStateAction<labTest[]>>;
}

const SearchTest: React.FC<SearchForATest> = ({
  searchInput,
  allTests,
  setSearchInput,
  setVisibleTests,
}: SearchForATest) => {
  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    e.preventDefault();
    const test = e.target.value;
    setSearchInput(test);
    if (!test) {
      setVisibleTests(allTests);
      return;
    }
    const filtered_tests = allTests.filter((t) =>
      t.lab_test_name.toLowerCase().includes(test.toLowerCase())
    );
    setVisibleTests(filtered_tests);
  }

  return (
    <div>
      <input
        value={searchInput}
        onChange={(e) => handleSearch(e)}
        placeholder="Search for a test"
        className="mb-10 text-xl rounded-s-m grow border border-gray-400 p-2 w-full h-15"
      />
    </div>
  );
};

export default SearchTest;

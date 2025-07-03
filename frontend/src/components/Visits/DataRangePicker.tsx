import React from 'react';

interface dateInput  {
  startDate:string;
  endDate:string;
  setStartDate:React.Dispatch<React.SetStateAction<string>>;
  setEndDate:React.Dispatch<React.SetStateAction<string>>;
}

const DateRangePicker : React.FC<dateInput> = ({startDate,endDate,setEndDate,setStartDate}) =>{
  
  return (
    <div className="relative w-full">
      
        <h2 className="text-xl font-semibold mb-4">Select Date Range</h2>

        <div className="gap2 mb-4">
          <label className="p-3 font-medium">From:</label>
          <input
            type="date"
            className="w-50 p-2 border rounded-lg text-center hover:bg-gray-300 focus:outline-none transition-all"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <label className="p-3 font-medium">To:</label>
          <input
            type="date"
            className="w-50 p-2 border rounded-lg text-center hover:bg-gray-300 focus:outline-none transition-all"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
    </div>
  );
}
export default DateRangePicker;
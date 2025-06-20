// const DateSearch = useCallback(async () => {
    //     // console.log(`status : ${status}`);
    //     // console.log(`start_date: ${startDate}`)
    //     // console.log(`end_date: ${endDate}`)
        
    //     try {
    //     setStatus("Fetching visits within this date range…");

    //     const response = await api.get("/visits/", {
    //         params: { start_date: startDate, end_date: endDate },
    //     });

    //     const fetchedVisits: Visit[] = response.data.items;
    //     setVisits(fetchedVisits);

    //     if (fetchedVisits.length === 0) {
    //         setStatus(`No visits found between ${startDate} and ${endDate}.`);
    //     } else {
    //         setStatus(`Found ${fetchedVisits.length} visit(s) from ${startDate} to ${endDate}.`);
    //     }
        
    //     const names: PatientInfo[] = await Promise.all(
    //     fetchedVisits.map(async (v) => {
    //         const resp = await api.get(`/patients/${v.patient_id}/visits/${v._id}/patient_name`);
    //         return {
    //         patient_id: v.patient_id,
    //         visit_id:   v._id,
    //         name:       resp.data.name
    //         };
    //     })
    //     );
    //         setPatientData(names);
    //     } catch (err:unknown) {
    //     setStatus(`Error fetching visits ${err}`);
    //     setVisits([]);
    //     }
        
    // }, [startDate, endDate]); 
    // useEffect(() => {
    //     handleSubmit();
    //     }, [handleSubmit]); 
    // DateSearch

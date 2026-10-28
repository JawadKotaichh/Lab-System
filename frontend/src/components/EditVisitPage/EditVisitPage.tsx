import { isAxiosError } from "axios";
import ActionButton from "../ActionButton";
import { Plus as AddActionIcon } from "lucide-react";
import SaveButton from "../SaveButton";
import CloseButton from "../CloseButton";
import { useFormValidation, ValidationSummary, dateError, moneyError } from "../FormValidation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBlocker, useParams } from "react-router-dom";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { CheckCircle2, Circle } from "lucide-react";
import api, { getApiErrorMessage } from "../../api";
import type { fetchedInvoiceData, labPanel, labTest, patientPanelResult, patientTestResult, resultListData, updateInvoiceData } from "../types";
import { fetchVisitEditor, fetchResultList } from "../utils";
import PatientInfo from "./PatientInfo";
import Prices, { invoiceGross } from "./Prices";
import TestResultsList, { type ResultTarget } from "./TestResultsList";
import AddTestResultTable from "./AddTestResultTable";
import LabPanelsTable from "./LabPanelsTable";
import LoadingPage from "../LoadingPage/LoadingPage";
import SaveFeedback, { type SaveState } from "./SaveFeedback";
import Pagination from "../Pagination";

type Source = { results: resultListData; invoice: fetchedInvoiceData };
export type VisitEdits = {
  tests: patientTestResult[];
  panels: (patientPanelResult & { nssf_id?: number })[];
  visitDate: string;
  reportDate: string;
  adjustment: string;
  paid: string;
  prices: Record<string, string>;
};
const clone = <T,>(value: T): T => structuredClone(value);
const rows = (edits: VisitEdits) => [...edits.tests, ...edits.panels.flatMap(p => p.list_of_test_results)];
export function addVisitPanel(edits: VisitEdits, panel: labPanel): VisitEdits {
  if (edits.panels.some(existing => existing.lab_panel_id === panel.id)) throw new Error("This lab panel is already included in the visit.");
  if (!panel.lab_tests.length) throw new Error("This panel has no tests.");
  const testIds = panel.lab_tests.map(test => test.lab_test_id);
  if (!panel.id || testIds.some(id => !id) || new Set(testIds).size !== testIds.length) {
    throw new Error("This panel has missing or repeated test identifiers. Reload the panel list and try again.");
  }
  const existingIds = new Set(rows(edits).map(test => test.lab_test_type_id));
  const overlap = panel.lab_tests.filter(test => existingIds.has(test.lab_test_id));
  if (overlap.length) throw new Error(`These tests are already included in the visit: ${overlap.map(test => test.name).join(", ")}. Remove the overlapping tests first.`);
  return { ...edits, panels: [...edits.panels, {
    lab_panel_id: panel.id, nssf_id: panel.nssf_id, lab_panel_name: panel.panel_name,
    lab_panel_price: panel.lab_panel_price ?? 0, lab_panel_category_id: panel.lab_panel_category_id ?? "",
    list_of_test_results: panel.lab_tests.map(test => ({
      lab_test_result_id: `pending-${panel.id}-${test.lab_test_id}`,
      lab_test_type_id: test.lab_test_id, lab_test_type: test, result: "",
    })),
  }] };
}
export function updateVisitResult(edits: VisitEdits, target: ResultTarget, value: string): VisitEdits {
  if (!target.testId || target.panelId === undefined) return edits;
  if (target.panelId === null) {
    return { ...edits, tests: edits.tests.map(test => test.lab_test_type_id === target.testId ? { ...test, result: value } : test) };
  }
  return { ...edits, panels: edits.panels.map(panel => panel.lab_panel_id === target.panelId
    ? { ...panel, list_of_test_results: panel.list_of_test_results.map(test => test.lab_test_type_id === target.testId ? { ...test, result: value } : test) }
    : panel) };
}
function validateResultTargets(results: resultListData) {
  const keys = new Set<string>();
  const check = (test: patientTestResult, panelId: string | null) => {
    const key = JSON.stringify([panelId, test.lab_test_type_id]);
    if (!test.lab_test_type_id || keys.has(key)) throw new Error("Some tests have missing or repeated test identifiers. Reload the visit before editing results.");
    keys.add(key);
  };
  results.list_of_standalone_test_results.forEach(test => check(test, null));
  results.list_of_panel_results.forEach(panel => {
    if (!panel.lab_panel_id) throw new Error("A panel identifier is missing. Reload the visit before editing results.");
    panel.list_of_test_results.forEach(test => check(test, panel.lab_panel_id));
  });
}
function validateResultIdentifiers(results: resultListData) {
  const identifiers = new Set<string>();
  for (const test of [...results.list_of_standalone_test_results, ...results.list_of_panel_results.flatMap(panel => panel.list_of_test_results)]) {
    if (!test.lab_test_result_id || identifiers.has(test.lab_test_result_id)) {
      throw new Error("The server returned missing or repeated result identifiers. Reload the visit before saving.");
    }
    identifiers.add(test.lab_test_result_id);
  }
}
const dateOnly = (date: unknown) => String(date).split("T")[0];
export function editsFrom(source: Source): VisitEdits {
  const invoice = source.invoice.invoice_data;
  return {
    tests: source.results.list_of_standalone_test_results.map(t => ({ ...t,
      lab_test_type: { ...(invoice.list_of_tests.find(x => x.lab_test_id === t.lab_test_type_id) ?? t.lab_test_type),
        lab_test_category_name: t.lab_test_type.lab_test_category_name ?? invoice.list_of_tests.find(x => x.lab_test_id === t.lab_test_type_id)?.lab_test_category_name },
    })),
    panels: source.results.list_of_panel_results.map(p => {
      const prior = invoice.list_of_lab_panels.find(x => x.id === p.lab_panel_id);
      return { ...p, nssf_id: prior?.nssf_id, lab_panel_price: prior?.lab_panel_price ?? p.lab_panel_price };
    }),
    visitDate: dateOnly(source.results.visit_date), reportDate: dateOnly(source.results.report_date),
    adjustment: String(invoice.adjustment_minor ?? 0), paid: String(invoice.total_paid ?? 0),
    prices: Object.fromEntries(invoice.list_of_lab_tests_ids_changed.map(x => [x.lab_test_id, String(x.new_price)])),
  };
}
export function editSignature(edits: VisitEdits): string {
  const numeric = (value: string) => value.trim() !== "" && Number.isFinite(Number(value)) ? Number(value) : value;
  return JSON.stringify([edits.visitDate, edits.reportDate, numeric(edits.adjustment), numeric(edits.paid),
    edits.tests.map(x => [x.lab_test_type_id, x.result]).sort(),
    edits.panels.map(p => [p.lab_panel_id, p.list_of_test_results.map(x => [x.lab_test_type_id, x.result]).sort()]).sort(),
    Object.entries(edits.prices).map(([id, price]) => [id, numeric(price)]).sort()]);
}
function invoiceFor(source: Source, edits: VisitEdits): updateInvoiceData {
  return { ...source.invoice.invoice_data,
    list_of_tests: edits.tests.map(t => t.lab_test_type),
    list_of_lab_panels: edits.panels.map(p => ({ id: p.lab_panel_id, nssf_id: p.nssf_id ?? 0,
      panel_name: p.lab_panel_name, lab_panel_price: p.lab_panel_price, lab_panel_category_id: p.lab_panel_category_id,
      lab_tests: p.list_of_test_results.map(t => t.lab_test_type) })),
    list_of_lab_tests_ids_changed: Object.entries(edits.prices).filter(([id]) => edits.tests.some(t => t.lab_test_type_id === id))
      .map(([lab_test_id, value]) => ({ lab_test_id, new_price: Number(value) })),
    list_of_lab_panels_ids_changed: source.invoice.invoice_data.list_of_lab_panels_ids_changed.filter(x => edits.panels.some(p => p.lab_panel_id === x.panel_id)),
    adjustment_minor: Number(edits.adjustment), total_paid: Number(edits.paid),
  };
}
export function validateVisitEdits(source: Source, edits: VisitEdits): string | null {
  const invalid = dateError(edits.visitDate, "Visit date") || dateError(edits.reportDate, "Report date")
    || moneyError(edits.adjustment, "Adjustment", true) || moneyError(edits.paid, "Paid amount")
    || Object.values(edits.prices).map(price => moneyError(price, "Test price")).find(Boolean);
  if (invalid) return invalid;
  if (Math.round((invoiceGross(invoiceFor(source, edits)) + Number(edits.adjustment)) * 1000) < 0) return "The adjustment makes the net total negative. Reduce the discount before saving.";
  return null;
}
async function readVisit(visitId: string): Promise<Source> {
  const { results, invoice } = await fetchVisitEditor(visitId);
  validateResultTargets(results);
  return { results, invoice };
}
class VisitChangedError extends Error {}
export async function saveVisitEdits(visitId: string, baseline: Source, edits: VisitEdits): Promise<Source> {
  const invalid = validateVisitEdits(baseline, edits);
  if (invalid) throw new Error(invalid);
  const current = await readVisit(visitId);
  if (editSignature(editsFrom(current)) !== editSignature(editsFrom(baseline)) ||
      current.invoice.currency !== baseline.invoice.currency ||
      current.invoice.invoice_data.patient_insurance_company_rate !== baseline.invoice.invoice_data.patient_insurance_company_rate) {
    throw new VisitChangedError("This visit changed since you opened it. Your edits are kept. Reload and review before saving.");
  }
  validateResultIdentifiers(current.results);
  const wantedTests = new Set(edits.tests.map(x => x.lab_test_type_id));
  const wantedPanels = new Set(edits.panels.map(x => x.lab_panel_id));
  for (const panel of current.results.list_of_panel_results) {
    if (!wantedPanels.has(panel.lab_panel_id)) await api.delete(`/lab_tests_results/delete_panels/${visitId}/${panel.lab_panel_id}`);
  }
  for (const test of current.results.list_of_standalone_test_results) {
    if (!wantedTests.has(test.lab_test_type_id)) await api.delete(`/lab_tests_results/${test.lab_test_result_id}`);
  }
  for (const panel of edits.panels) {
    const saved = current.results.list_of_panel_results.find(p => p.lab_panel_id === panel.lab_panel_id);
    if (!saved || panel.list_of_test_results.some(t => !saved.list_of_test_results.some(r => r.lab_test_type_id === t.lab_test_type_id))) {
      await api.post(`/lab_tests_results/${visitId}/${panel.lab_panel_id}`);
    }
  }
  for (const test of edits.tests) {
    if (!current.results.list_of_standalone_test_results.some(t => t.lab_test_type_id === test.lab_test_type_id)) {
      await api.post(`/lab_tests_results/${visitId}`, { lab_test_type_id: test.lab_test_type_id, visit_id: visitId, result: test.result });
    }
  }
  const live = await fetchResultList(visitId, true);
  validateResultIdentifiers(live);
  const scopedRows = [
    ...edits.tests.map(test => ({ test, panelId: null as string | null })),
    ...edits.panels.flatMap(panel => panel.list_of_test_results.map(test => ({ test, panelId: panel.lab_panel_id }))),
  ];
  const updates = [];
  for (const { test, panelId } of scopedRows) {
    const savedRows = panelId === null ? live.list_of_standalone_test_results
      : live.list_of_panel_results.find(panel => panel.lab_panel_id === panelId)?.list_of_test_results ?? [];
    const saved = savedRows.find(row => row.lab_test_type_id === test.lab_test_type_id);
    if (!saved) throw new Error("A test could not be added. Retry saving to finish.");
    const previousRows = panelId === null ? current.results.list_of_standalone_test_results
      : current.results.list_of_panel_results.find(panel => panel.lab_panel_id === panelId)?.list_of_test_results ?? [];
    const previous = previousRows.find(row => row.lab_test_type_id === test.lab_test_type_id);
    if (previous && saved.result !== previous.result) throw new VisitChangedError("A result changed while saving. Your edits are kept; reload and review before saving.");
    if (saved.result !== test.result) updates.push({ result_id: saved.lab_test_result_id, test_id: test.lab_test_type_id, panel_id: panelId, expected: saved.result, value: test.result });
  }
  if (updates.length) {
    try { await api.put(`/visits/${visitId}/results`, { updates }); }
    catch (error) {
      if (isAxiosError(error) && error.response?.status === 409) {
        throw new VisitChangedError(getApiErrorMessage(error, "Results changed while saving. Reload and review before saving."));
      }
      throw error;
    }
  }
  await api.put(`/visits/${visitId}`, { visit_date: `${edits.visitDate}T00:00:00`, report_date: `${edits.reportDate}T00:00:00` });
  await api.put(`/invoices/${visitId}/update_invoice`, { ...invoiceFor(current, edits), visit_date: `${edits.visitDate}T00:00:00` });
  const confirmed = await readVisit(visitId);
  if (editSignature(editsFrom(confirmed)) !== editSignature(edits)) throw new Error("The server returned different values. Review the saved visit before retrying.");
  return confirmed;
}

export function paginateVisitResults(edits: VisitEdits, pageIndex: number, pageSize: number) {
  const units = [
    ...edits.tests.map(test => ({test, panel: null as VisitEdits["panels"][number] | null})),
    ...edits.panels.flatMap<{test: patientTestResult | null; panel: VisitEdits["panels"][number]}>(panel => panel.list_of_test_results.length
      ? panel.list_of_test_results.map(test => ({test, panel})) : [{test: null, panel}]),
  ];
  const totalPages = Math.max(1, Math.ceil(units.length / pageSize));
  const safeIndex = Math.max(0, Math.min(pageIndex, totalPages - 1));
  const tests: patientTestResult[] = [], panels: VisitEdits["panels"] = [];
  for (const {test, panel} of units.slice(safeIndex * pageSize, (safeIndex + 1) * pageSize)) {
    if (!panel) { if (test) tests.push(test); continue; }
    let group = panels.find(item => item.lab_panel_id === panel.lab_panel_id);
    if (!group) { group = {...panel, list_of_test_results: []}; panels.push(group); }
    if (test) group.list_of_test_results.push(test);
  }
  return {tests, panels, pageIndex: safeIndex, totalPages, total: units.length};
}

export default function EditVisitPage() {
  const { visit_id } = useParams<{ visit_id: string }>();
  const [source, setSource] = useState<Source | null>(null);
  const [edits, setEdits] = useState<VisitEdits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState<SaveState>({ status: "idle" });
  const [showTests, setShowTests] = useState(false);
  const [showPanels, setShowPanels] = useState(false);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });
  const savingRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [requiresReview, setRequiresReview] = useState(false);
  const baseline = useRef<Source | null>(null);
  const dirty = Boolean(source && edits && editSignature(edits) !== editSignature(editsFrom(source)));
  const blocker = useBlocker(({ currentLocation, nextLocation }) => (dirty || saving) && currentLocation.pathname !== nextLocation.pathname);
  const load = useCallback(async () => {
    if (!visit_id) return;
    setLoading(true);
    try {
      const data = await readVisit(visit_id);
      baseline.current = data; setSource(data); setEdits(editsFrom(data));
      setError(""); setFeedback({ status: "idle" }); setRequiresReview(false);
    } catch (e) { setError(getApiErrorMessage(e, "Could not load this visit")); }
    finally { setLoading(false); }
  }, [visit_id]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty || saving) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, saving]);
  const change = (update: (previous: VisitEdits) => VisitEdits) => {
    setEdits(previous => previous ? update(previous) : previous);
    setFeedback({ status: "idle" }); setError("");
  };
  const invoice = useMemo(() => source && edits ? invoiceFor(source, edits) : null, [source, edits]);
  const validation = useFormValidation(edits ? [
    { name: "visitDate", label: "Visit date", error: dateError(edits.visitDate, "Visit date") },
    { name: "reportDate", label: "Report date", error: dateError(edits.reportDate, "Report date") },
    { name: "adjustment", label: "Adjustment", error: moneyError(edits.adjustment, "Adjustment", true) || (invoice && Math.round((invoiceGross(invoice) + Number(edits.adjustment)) * 1000) < 0 ? "The adjustment makes the net total negative. Reduce the discount." : null) },
    { name: "paid", label: "Paid amount", error: moneyError(edits.paid, "Paid amount") },
    ...Object.entries(edits.prices).map(([id, price]) => ({ name: `price-${id}`, label: "Test price", error: moneyError(price, `${edits.tests.find(test => test.lab_test_type_id === id)?.lab_test_type.name ?? "Test"} price`) })),
  ] : [], name => {
    if (!edits || !name.startsWith("price-")) return;
    const index = edits.tests.findIndex(test => `price-${test.lab_test_type_id}` === name);
    if (index >= 0) setPagination(previous => ({ ...previous, pageIndex: Math.floor(index / previous.pageSize) }));
  });
  const save = async () => {
    if (!edits || !baseline.current || !visit_id || savingRef.current) return false;
    if (!validation.validate()) { setFeedback({ status: "error", message: "Please correct the highlighted fields before saving." }); return false; }
    if (!dirty) { setFeedback({ status: "saved", message: "No unsaved changes" }); return true; }
    const invalid = validateVisitEdits(baseline.current, edits);
    if (invalid) { setFeedback({ status: "error", message: invalid }); return false; }
    savingRef.current = true; setSaving(true); setFeedback({ status: "saving", message: "Saving changes…" });
    try {
      const data = await saveVisitEdits(visit_id, baseline.current, clone(edits));
      baseline.current = data; setSource(data); setEdits(editsFrom(data));
      setFeedback({ status: "saved", message: "All changes saved" }); return true;
    } catch (e) {
      if (e instanceof VisitChangedError) setRequiresReview(true);
      else {
        // Existing APIs are separate writes. Reconcile acknowledged progress, retaining every remaining edit.
        try { const actual = await readVisit(visit_id); baseline.current = actual; setSource(actual); }
        catch { setRequiresReview(true); }
      }
      setFeedback({ status: "error", message: getApiErrorMessage(e, "Save did not complete") + " Your remaining edits are kept." });
      return false;
    } finally { savingRef.current = false; setSaving(false); }
  };
  if (loading) return <LoadingPage title="Loading visit ..." />;
  if (!source || !edits || !invoice || !visit_id) return <div className="p-8"><p role="alert">{error || "Visit not found"}</p><button onClick={() => void load()} className="mt-4 underline">Retry</button></div>;
  const patient = source.results.patient;
  const allIds = new Set(rows(edits).map(x => x.lab_test_type_id));
  const addTest = (test: labTest) => {
    if (allIds.has(test.lab_test_id)) { setError("That test is already included in this visit."); return; }
    change(previous => ({ ...previous, tests: [...previous.tests, { lab_test_result_id: `pending-${test.lab_test_id}`, lab_test_type_id: test.lab_test_id, lab_test_type: test, result: "" }] }));
    setShowTests(false);
  };
  const addPanel = (panel: labPanel) => {
    try {
      const next = addVisitPanel(edits, panel);
      change(() => next);
      setShowPanels(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not add this lab panel.");
    }
  };
  const resultPage = paginateVisitResults(edits, pagination.pageIndex, pagination.pageSize);
  return <div className="p-4 pb-40 sm:p-8 sm:pb-40 bg-white">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-semibold">Edit Visit</h1></div>
      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ${dirty ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"}`}>{dirty ? <Circle className="h-3 w-3 fill-current" /> : <CheckCircle2 className="h-4 w-4" />}{dirty ? "Unsaved changes" : "Up to date"}</span>
    </div>
    {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
    <ValidationSummary validation={validation} />
    <fieldset disabled={saving} className="min-w-0 border-0 p-0">
      <PatientInfo validation={validation} patientData={patient} visitDate={edits.visitDate} reportDate={edits.reportDate} onVisitDateChange={value => change(p => ({ ...p, visitDate: value }))} onReportDateChange={value => change(p => ({ ...p, reportDate: value }))} />
      <Prices validation={validation} updatedInvoiceData={invoice} currency={source.invoice.currency} adjustment={edits.adjustment} paid={edits.paid} onAdjustmentChange={value => change(p => ({ ...p, adjustment: value }))} onPaidChange={value => change(p => ({ ...p, paid: value }))} />
      <div className="mt-6 flex gap-3"><ActionButton type="button" onClick={() => setShowTests(true)} variant="secondary" icon={AddActionIcon}>Add test result</ActionButton><ActionButton type="button" onClick={() => setShowPanels(true)} variant="secondary" icon={AddActionIcon}>Add lab panel</ActionButton></div>
      <TestResultsList panelResults={resultPage.panels} standAloneTestResults={resultPage.tests}
        onRemoveTest={id => change(p => { const prices = { ...p.prices }; delete prices[id]; return { ...p, prices, tests: p.tests.filter(test => test.lab_test_type_id !== id) }; })}
        onRemovePanel={id => change(p => ({ ...p, panels: p.panels.filter(x => x.lab_panel_id !== id) }))}
        onResultChange={(target, value) => change(previous => updateVisitResult(previous, target, value))} />
      <Pagination currentPage={resultPage.pageIndex + 1} totalPages={resultPage.totalPages} pageSize={pagination.pageSize} TotalNumberOfPaginatedItems={resultPage.total} setCurrentPage={page => setPagination(p => ({ ...p, pageIndex: page - 1 }))} setPageSize={size => setPagination({ pageIndex: 0, pageSize: size })} />
    </fieldset>
    {showTests && <AddTestResultTable onSelectTest={addTest} showTestsTable showAdd visit_id={visit_id} error={error} addError={error} setError={setError} setAddError={setError} setShowTestsTable={setShowTests} existingLabTestTypeIds={allIds} standAloneTestResults={edits.tests} panelResults={edits.panels} setStandAloneTestResults={() => {}} setPanelResults={() => {}} refreshResults={async () => {}} markExistingLabTestIdsDirty={() => {}} setUpdatedInvoiceData={() => {}} setCurrency={() => {}} />}
    {showPanels && <LabPanelsTable onSelectPanel={addPanel} pagination={pagination} visit_id={visit_id} showPanelsTable setShowPanelsTable={setShowPanels} panelResults={edits.panels} setPanelResults={() => {}} setStandAloneTestResults={() => {}} setTotalNumberOfTests={() => {}} refreshResults={async () => {}} markExistingLabTestIdsDirty={() => {}} setUpdatedInvoiceData={() => {}} setCurrency={() => {}} />}
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white px-4 py-4 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3"><div aria-live="polite"><SaveFeedback state={feedback} onRetry={!requiresReview ? () => void save() : undefined} /></div>
        <div className="ml-auto flex items-center gap-3">
          {requiresReview ? <button type="button" className="rounded-lg bg-blue-700 px-5 py-2 text-white" onClick={() => { if (window.confirm("Reload saved data? Unsaved edits will be discarded.")) void load(); }}>Reload saved visit</button> : <SaveButton saving={saving} onClick={() => void save()}>Save changes</SaveButton>}
        </div>
      </div>
    </div>
    <Dialog open={blocker.state === "blocked"} onClose={() => blocker.state === "blocked" && blocker.reset()} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-slate-900/40" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
          <header className="flex items-start justify-between gap-4">
            <DialogTitle className="text-xl font-semibold">Save changes?</DialogTitle>
            <CloseButton label="Close unsaved changes dialog and keep editing" disabled={saving}
              onClick={() => blocker.state === "blocked" && blocker.reset()} />
          </header>
          <p className="mt-3 text-gray-600">Save your changes before continuing, or keep editing this visit.</p>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button disabled={saving} onClick={() => blocker.state === "blocked" && blocker.reset()} className="rounded-lg border px-4 py-2">Keep editing</button>
            <SaveButton saving={saving} disabled={requiresReview} onClick={async () => {
              if (await save()) { if (blocker.state === "blocked") blocker.proceed(); }
            }}>Save</SaveButton>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  </div>;
}

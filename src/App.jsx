import { Intro } from "./components/Intro.jsx";
import { Notes } from "./components/Notes.jsx";
import { SearchPanel } from "./components/SearchPanel.jsx";
import { TransferResults } from "./components/TransferResults.jsx";
import { useRoutes } from "./hooks/useRoutes.js";
import { useTransferSearch } from "./hooks/useTransferSearch.js";

export default function App() {
  const { routes, error: routesError, routeSet } = useRoutes();
  const search = useTransferSearch(routeSet);

  return (
    <main className="page">
      <Intro />
      <SearchPanel
        routes={routes}
        routeSet={routeSet}
        routesError={routesError}
        query={search.query}
        onQueryChange={search.setQuery}
        searching={search.status === "loading"}
        recent={search.recent}
        onSearch={search.search}
      />
      <TransferResults
        result={search.result}
        sections={search.sections}
        status={search.status}
        message={search.message}
        openSectionId={search.openSectionId}
        onOpenSection={search.openSection}
        onToggleSection={search.toggleSection}
        openRows={search.openRows}
        onToggleRow={search.toggleRow}
      />
      <Notes />
    </main>
  );
}

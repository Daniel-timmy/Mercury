import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner,
  Button,
  Chip,
} from "@heroui/react";

/**
 * Format date to readable string
 */
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Reusable table component for displaying personnel data
 * @param {Object} props
 * @param {Array} props.data - Array of personnel objects
 * @param {boolean} props.loading - Loading state
 * @param {string} props.error - Error message
 * @param {string} props.title - Table title
 * @param {number} props.count - Total count
 * @param {boolean} props.hasNext - Whether there's a next page
 * @param {boolean} props.hasPrevious - Whether there's a previous page
 * @param {Function} props.onNext - Next page handler
 * @param {Function} props.onPrevious - Previous page handler
 * @param {Array} props.allManagers - List of all managers for lookup
 */
export function PersonnelTable({
  data = [],
  loading = false,
  error = null,
  title = "Personnel",
  count = 0,
  hasNext = false,
  hasPrevious = false,
  onNext,
  onPrevious,
  allManagers = [],
}) {
  const getManagerName = (managerId) => {
    if (!managerId) return "None";
    const manager = allManagers.find((m) => m.id === managerId);
    return manager ? manager.name : `Manager #${managerId}`;
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "danger";
      case "manager":
        return "warning";
      case "driver":
        return "primary";
      default:
        return "default";
    }
  };

  if (loading && data.length === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-danger text-sm">Error loading data: {error}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          {title} ({count})
        </h2>
      </div>

      <Table aria-label={`${title} table`} className="mb-4">
        <TableHeader>
          <TableColumn>ID</TableColumn>
          <TableColumn>NAME</TableColumn>
          <TableColumn>EMAIL</TableColumn>
          <TableColumn>ROLE</TableColumn>
          <TableColumn>MANAGER</TableColumn>
          <TableColumn>DATE JOINED</TableColumn>
        </TableHeader>
        <TableBody emptyContent="No personnel found">
          {data.map((person) => (
            <TableRow key={person.id}>
              <TableCell>{person.id}</TableCell>
              <TableCell>{person.name}</TableCell>
              <TableCell>{person.email}</TableCell>
              <TableCell>
                <Chip color={getRoleColor(person.role)} size="sm" variant="flat">
                  {person.role.charAt(0).toUpperCase() + person.role.slice(1)}
                </Chip>
              </TableCell>
              <TableCell>{getManagerName(person.manager)}</TableCell>
              <TableCell>{formatDate(person.date_joined)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination Controls */}
      {(hasNext || hasPrevious) && (
        <div className="flex justify-center gap-2">
          <Button
            size="sm"
            variant="flat"
            onPress={onPrevious}
            isDisabled={!hasPrevious || loading}
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="flat"
            onPress={onNext}
            isDisabled={!hasNext || loading}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
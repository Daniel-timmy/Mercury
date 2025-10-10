import {
  Card,
  CardBody,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";
import LineGraph from "./LineGraph";

/**
 * InfoRow component for displaying label-value pairs
 */
function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-foreground/60 uppercase tracking-wide">
        {label}
      </span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

/**
 * StatusTable component for displaying duty status hours
 */
function StatusTable({ driving, berth, onDuty, offDuty }) {
  return (
    <Table
      aria-label="Duty Status Hours"
      classNames={{
        wrapper: "shadow-sm",
      }}
    >
      <TableHeader>
        <TableColumn>Driving</TableColumn>
        <TableColumn>Sleeper Berth</TableColumn>
        <TableColumn>On Duty</TableColumn>
        <TableColumn>Off Duty</TableColumn>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>{driving}</TableCell>
          <TableCell>{berth}</TableCell>
          <TableCell>{onDuty}</TableCell>
          <TableCell>{offDuty}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

/**
 * LogsheetCard component - displays driver's record of duty status
 * @param {Object} props
 * @param {Object} props.logsheet - The logsheet data containing all information
 * @param {Array} props.entries - Array of log entries for the line graph
 * @param {Function} props.onNewEntry - Callback for new entry button
 */
export function LogsheetCard({ logsheet, entries, onNewEntry }) {
  if (!logsheet) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-foreground/60">
          No logsheet data available.
        </p>
      </div>
    );
  }
  // Get today's date in the same format as logsheet.date
  const today = new Date().toISOString().split("T")[0];
  const isToday = logsheet.date === today;

  const driverName = logsheet.driver;

  return (
    <Card
      className="w-full lg:max-w-[95%] mx-auto mb-6"
      shadow="md"
      classNames={{
        base: "border border-divider/50",
      }}
    >
      <CardBody className="p-6 sm:p-8">
        {/* Title */}
        <div className="text-center mb-8 pb-6 border-b-2 border-divider">
          <h4 className="text-xl sm:text-2xl font-bold text-foreground">
            Driver's Record of Duty Status
          </h4>
          <p className="text-xs text-foreground/60 mt-2">
            Electronic Logging Device Report
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Driver Information Section */}
          <div className="bg-content2 rounded-lg p-5">
            <h5 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wide">
              Driver Information
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <InfoRow label="Driver's Name" value={driverName || "N/A"} />
              <InfoRow label="Total Miles" value={logsheet.total_mileage} />
              <InfoRow label="Date" value={logsheet.date} />
            </div>
          </div>

          {/* Location & Cargo Section */}
          <div className="bg-content2 rounded-lg p-5">
            <h5 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wide">
              Location & Cargo Details
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InfoRow label="Carrier Name" value={logsheet.shipper || "N/A"} />
              <InfoRow label="Commodity" value={logsheet.commodity || "N/A"} />
              <InfoRow
                label="Pickup Location"
                value={logsheet.pickup_location || "N/A"}
              />
              <InfoRow
                label="Destination Address"
                value={logsheet.dropoff_location || "N/A"}
              />
              <InfoRow
                label="Current Address"
                value={logsheet.current_location || "N/A"}
              />
            </div>
          </div>

          {/* Vehicle Information Section */}
          <div className="bg-content2 rounded-lg p-5">
            <h5 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wide">
              Vehicle Information
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <InfoRow
                label="Vehicle No"
                value={logsheet.vehicle_no || "N/A"}
              />
              <InfoRow
                label="Trailer No"
                value={logsheet.trailer_no || "N/A"}
              />
            </div>
          </div>

          {/* Line Graph */}
          <div className="my-8">
            <h5 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wide">
              Duty Status Timeline
            </h5>
            <LineGraph entries={entries} />
          </div>

          {/* Status Table */}
          <div>
            <h5 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wide">
              Hours Summary
            </h5>
            <StatusTable
              driving={logsheet.driving}
              berth={logsheet.berth}
              onDuty={logsheet.on_duty}
              offDuty={logsheet.off_duty}
            />
          </div>

          {/* Remarks Section */}
          <div className="bg-content2 rounded-lg p-5">
            <h5 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wide">
              Remarks
            </h5>
            <p className="text-sm text-foreground/70 italic">
              {"No remarks available."}
            </p>
          </div>

          {/* Driver's Signature */}
          <div className="bg-content2 rounded-lg p-5">
            <h5 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wide">
              Driver's Signature
            </h5>
            <p className="text-base font-semibold text-foreground">
              {driverName || "N/A"}
            </p>
          </div>
        </div>

        {/* Action Buttons - Only show if date is today */}
        {isToday && (
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8 pt-6 border-t border-divider">
            <Button
              color="success"
              size="lg"
              onPress={onNewEntry}
              className="w-full sm:w-auto min-w-[160px] font-semibold"
            >
              New Entry
            </Button>
            {/* <Button
              color="primary"
              size="lg"
              onPress={onUpdateLogsheet}
              className="w-full sm:w-auto min-w-[160px] font-semibold"
            >
              Update Logsheet
            </Button> */}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

import { Card, CardContent } from "@/components/ui/card";
import { JobData } from "@/types";

type JobDetailsCardProps = {
  jobData: JobData;
};

export default function JobDetailsCard({ jobData }: JobDetailsCardProps) {
  return (
    <Card className="w-[800px] p-6 border-2 border-black rounded-lg shadow-md bg-white">
      <CardContent className="flex flex-col items-center text-black">
        {/* ✅ Grid Layout for Job Details */}
        <div className="grid grid-cols-3 gap-4 w-full text-center text-lg">
          <div className="flex flex-col">
            <span className="font-bold">Contract</span>
            <span>{jobData.contract_number}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold">{jobData.customer_name}</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold">Route Card</span>
            <span>{jobData.route_card}</span>
          </div>

          <div className="flex flex-col">
            <span className="font-bold">Part</span>
            <span>{jobData.part_number}</span>
          </div>
          <div className="flex flex-col col-span-2">
            <span className="font-bold">Description</span>
            <span>{jobData.description}</span>
          </div>

          <div className="flex flex-col">
            <span className="font-bold">Due Date</span>
            <span>{new Date(jobData.due_date).toLocaleDateString()}</span>
          </div>

          <div className="flex flex-col col-span-2">
            <span className="font-bold">Status</span>
            <span
              className={
                jobData.status === "Unstarted"
                  ? "text-red-600 font-semibold"
                  : ""
              }
            >
              {jobData.status}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="font-bold">QTY</span>
            <span>{jobData.quantity}</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold">Completed QTY</span>
            <span>{jobData.completed_qty}</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold">Balance</span>
            <span>{jobData.balance ?? "N/A"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

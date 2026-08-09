import { Download, FileText, Upload } from "lucide-react";
import { Card, Btn } from "../App";

export function DocumentsModule() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Documents Center</h2>
          <p className="text-sm text-slate-500">Download official certificates and upload required files.</p>
        </div>
        <Btn variant="primary" icon={<Upload size={14} />}>Upload Document</Btn>
      </div>

      <Card className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { name: "Student ID Card", desc: "Digital copy of your ID card", status: "Available" },
            { name: "Bonafide Certificate", desc: "For scholarships or bank loans", status: "Available" },
            { name: "Semester 5 Marksheet", desc: "Official academic record", status: "Available" },
            { name: "Fee Receipt (Sem 6)", desc: "Proof of payment", status: "Available" },
            { name: "Transfer Certificate", desc: "Issued after graduation", status: "Unavailable" },
          ].map((d, i) => (
            <div key={i} className={`p-4 border border-slate-100 dark:border-slate-800 rounded-xl flex flex-col justify-between ${d.status === 'Available' ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800/40 opacity-75'}`}>
              <div>
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 mb-3">
                  <FileText size={20} />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white leading-tight">{d.name}</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">{d.desc}</p>
              </div>
              <Btn variant={d.status === 'Available' ? 'outline' : 'secondary'} className="w-full" disabled={d.status !== 'Available'} icon={<Download size={14}/>}>
                {d.status === 'Available' ? 'Download PDF' : 'Not Generated'}
              </Btn>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

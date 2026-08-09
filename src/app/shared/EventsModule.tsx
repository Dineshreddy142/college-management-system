import { CalendarDays, MapPin, Search } from "lucide-react";
import { Card, Badge, Btn } from "../App";

export function EventsModule() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Events & Hackathons</h2>
          <p className="text-sm text-slate-500">Register for campus events and workshops.</p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search events..." className="pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm w-full sm:w-64" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {[
          { title: "TechNova 2024 (Hackathon)", date: "Aug 15 - Aug 17", location: "Main Auditorium", type: "Hackathon", registered: false },
          { title: "AI & Future of Tech Workshop", date: "Sept 10", location: "CS Seminar Hall", type: "Workshop", registered: true },
          { title: "Annual Cultural Fest", date: "Oct 5 - Oct 7", location: "College Grounds", type: "Cultural", registered: false },
        ].map((e, i) => (
          <Card key={i} className="p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex justify-between items-start mb-3">
                <Badge variant={e.type === 'Hackathon' ? 'info' : e.type === 'Workshop' ? 'warning' : 'success'}>{e.type}</Badge>
                {e.registered && <Badge variant="default" className="bg-emerald-100 text-emerald-700">Registered</Badge>}
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">{e.title}</h3>
              <div className="space-y-1.5 mb-6 text-sm text-slate-500">
                <p className="flex items-center gap-2"><CalendarDays size={14}/> {e.date}</p>
                <p className="flex items-center gap-2"><MapPin size={14}/> {e.location}</p>
              </div>
            </div>
            {e.registered ? (
              <Btn variant="outline" className="w-full">Download Pass</Btn>
            ) : (
              <Btn variant="primary" className="w-full">Register Now</Btn>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

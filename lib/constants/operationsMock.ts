export interface Operation {
  id: string
  date: string
  patient_name: string
  operation: string
  begin_time: string
  end_time: string
  duration: string
  amount: string
}

export const OPERATIONS: Operation[] = [
  {
    id: "OP001",
    date: "15/10/2025",
    patient_name: "KARAN SINGH",
    operation: "FOREIGNBODY",
    begin_time: "12:00",
    end_time: "13:00",
    duration: "60 min",
    amount: "₹30000",
  },
  {
    id: "OP002",
    date: "11/10/2025",
    patient_name: "ARJUN VERMA",
    operation: "FOREIGNBODY",
    begin_time: "12:00",
    end_time: "13:00",
    duration: "60 min",
    amount: "₹30000",
  },
]
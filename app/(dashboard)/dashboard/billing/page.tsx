"use client"

import * as React from "react"
import {
  Plus,
  Search,
  Filter,
  CreditCard,
  Eye,
  Edit,
  Trash2,
  Printer,
  DollarSign,
  TrendingUp,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { InvoiceForm } from "@/components/invoice-form"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"

const invoices = [
  {
    id: "INV001",
    date: "15/11/2025",
    patient_name: "AARAV MEHTA",
    items: "Consultation, Eye Drops",
    total: "₹1,250",
    paid: "₹1,250",
    balance: "₹0",
    status: "Paid",
  },
  {
    id: "INV002",
    date: "14/11/2025",
    patient_name: "NISHANT KAREKAR",
    items: "LASIK Surgery",
    total: "₹45,000",
    paid: "₹30,000",
    balance: "₹15,000",
    status: "Partial",
  },
  {
    id: "INV003",
    date: "13/11/2025",
    patient_name: "PRIYA NAIR",
    items: "Cataract Surgery, IOL",
    total: "₹35,000",
    paid: "₹0",
    balance: "₹35,000",
    status: "Unpaid",
  },
]

const statusColors = {
  Paid: "bg-green-100 text-green-700 border-green-200",
  Partial: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Unpaid: "bg-red-100 text-red-700 border-red-200",
}

export default function BillingPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing & Invoices</h1>
          <p className="text-muted-foreground">
            Manage invoices and payment tracking
          </p>
        </div>
        <InvoiceForm>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Invoice
          </Button>
        </InvoiceForm>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹12,45,000</div>
            <p className="text-xs text-muted-foreground">this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹2,15,000</div>
            <p className="text-xs text-muted-foreground">pending payment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invoices</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">143</div>
            <p className="text-xs text-muted-foreground">this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">82.7%</div>
            <p className="text-xs text-muted-foreground">collection rate</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Invoices</CardTitle>
              <CardDescription>
                View and manage all billing invoices
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search invoices..."
                  className="pl-8 w-[200px]"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SR. NO.</TableHead>
                  <TableHead>INVOICE NO.</TableHead>
                  <TableHead>DATE</TableHead>
                  <TableHead>PATIENT NAME</TableHead>
                  <TableHead>ITEMS</TableHead>
                  <TableHead>TOTAL</TableHead>
                  <TableHead>PAID</TableHead>
                  <TableHead>BALANCE</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead>ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice, index) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{invoice.id}</TableCell>
                    <TableCell>{invoice.date}</TableCell>
                    <TableCell className="font-medium uppercase">{invoice.patient_name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{invoice.items}</TableCell>
                    <TableCell className="font-semibold">{invoice.total}</TableCell>
                    <TableCell className="font-semibold">{invoice.paid}</TableCell>
                    <TableCell className="font-semibold">{invoice.balance}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusColors[invoice.status as keyof typeof statusColors]}
                      >
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="View">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <InvoiceForm invoiceData={invoice} mode="edit">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </InvoiceForm>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => window.print()}
                          title="Print"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <DeleteConfirmDialog
                          title="Delete Invoice"
                          description={`Are you sure you want to delete invoice ${invoice.id}? This action cannot be undone.`}
                          onConfirm={() => console.log("Delete invoice:", invoice.id)}
                        >
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </DeleteConfirmDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

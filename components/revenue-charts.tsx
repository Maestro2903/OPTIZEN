"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Simple inline chart components (without external charting library)
export function RevenueVsExpenseChart() {
  const months = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"]
  const revenue = [8.5, 9.2, 10.1, 11.3, 11.8, 12.4]
  const expenses = [6.2, 6.5, 6.8, 7.1, 7.4, 7.6]

  const maxValue = Math.max(...revenue, ...expenses)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue vs Expenses</CardTitle>
        <CardDescription>Monthly comparison (in lakhs)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {months.map((month, index) => (
            <div key={month} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{month}</span>
                <div className="flex gap-4">
                  <span className="text-green-600">₹{revenue[index]}L</span>
                  <span className="text-red-600">₹{expenses[index]}L</span>
                </div>
              </div>
              <div className="flex gap-2 h-6">
                <div className="flex-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${(revenue[index] / maxValue) * 100}%` }}
                  />
                </div>
                <div className="flex-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full transition-all"
                    style={{ width: `${(expenses[index] / maxValue) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm">Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-sm">Expenses</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function RevenueByPaymentMethod() {
  const methods = [
    { name: "Cash", amount: 4.2, percentage: 34, color: "bg-blue-500" },
    { name: "Card", amount: 3.8, percentage: 31, color: "bg-green-500" },
    { name: "UPI", amount: 2.9, percentage: 23, color: "bg-purple-500" },
    { name: "Insurance", amount: 1.5, percentage: 12, color: "bg-orange-500" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue by Payment Method</CardTitle>
        <CardDescription>This month breakdown (in lakhs)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {methods.map((method) => (
            <div key={method.name} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{method.name}</span>
                <span className="text-muted-foreground">
                  ₹{method.amount}L ({method.percentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full ${method.color} rounded-full transition-all`}
                  style={{ width: `${method.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function RevenueByServiceType() {
  const services = [
    { name: "Surgery", amount: 5.8, percentage: 47, color: "bg-red-500" },
    { name: "Consultation", amount: 3.2, percentage: 26, color: "bg-blue-500" },
    { name: "Optical", amount: 2.1, percentage: 17, color: "bg-green-500" },
    { name: "Pharmacy", amount: 1.3, percentage: 10, color: "bg-purple-500" },
  ]

  const total = services.reduce((sum, s) => sum + s.amount, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue by Service Type</CardTitle>
        <CardDescription>This month breakdown (in lakhs)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center mb-6">
          <div className="relative w-48 h-48">
            {/* Simple pie chart using conic gradient */}
            <div
              className="w-full h-full rounded-full"
              style={{
                background: `conic-gradient(
                  #ef4444 0% ${services[0].percentage}%,
                  #3b82f6 ${services[0].percentage}% ${services[0].percentage + services[1].percentage}%,
                  #22c55e ${services[0].percentage + services[1].percentage}% ${services[0].percentage + services[1].percentage + services[2].percentage}%,
                  #a855f7 ${services[0].percentage + services[1].percentage + services[2].percentage}% 100%
                )`
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold">₹{total}L</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {services.map((service) => (
            <div key={service.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${service.color}`} />
                <span className="font-medium">{service.name}</span>
              </div>
              <span className="text-muted-foreground">
                ₹{service.amount}L ({service.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}


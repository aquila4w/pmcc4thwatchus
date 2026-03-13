"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Church,
  Users,
  Mail,
  Phone,
  MapPin,
  Loader2,
  Edit,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ChurchData {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  pastor?: {
    name: string;
    phone?: string;
    email?: string;
  };
  subDistrict?: {
    id: string;
    name: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  church?: ChurchData;
}

interface Member {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
}

interface MemberStats {
  totalMembers: number;
  activeMembers: number;
  recentRegistrations: number;
}

export default function MyChurchPage() {
  const [user, setUser] = useState<User | null>(null);
  const [church, setChurch] = useState<ChurchData | null>(null);
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Get current user
      const userRes = await fetch("/api/auth/me");
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);

        if (userData.user?.church) {
          // Fetch full church details
          const churchRes = await fetch(
            `/payload-api/churches/${userData.user.church.id}?depth=1`
          );
          if (churchRes.ok) {
            const churchData = await churchRes.json();
            setChurch(churchData);
          }

          // Fetch member stats for this church
          const membersRes = await fetch(
            `/payload-api/users?where[church][equals]=${userData.user.church.id}&limit=999`
          );
          if (membersRes.ok) {
            const membersData = await membersRes.json();
            const approvedMembers = membersData.docs?.filter(
              (m: Member) => m.status === "approved"
            ) || [];
            setStats({
              totalMembers: approvedMembers.length,
              activeMembers: approvedMembers.length, // Could filter by recent activity
              recentRegistrations: approvedMembers.filter(
                (m: Member) => {
                  const createdAt = new Date(m.createdAt);
                  const thirtyDaysAgo = new Date();
                  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                  return createdAt > thirtyDaysAgo;
                }
              ).length,
            });
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!church) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My Church</h1>
          <p className="text-slate-500">View your church information</p>
        </div>
        <Card className="bg-white p-12 text-center">
          <Church className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">
            No Church Assigned
          </h3>
          <p className="text-slate-500">
            You haven't been assigned to a church yet. Please contact your administrator.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Church</h1>
          <p className="text-slate-500">{church.name}</p>
        </div>
        {(user?.role === "superAdmin" ||
          user?.role === "districtCoordinator" ||
          user?.role === "subDistrictCoordinator" ||
          user?.role === "headMinister") && (
          <Button variant="outline" asChild>
            <Link href={`/cms/collections/churches/${church.id}`}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Church
            </Link>
          </Button>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalMembers}</p>
                <p className="text-sm text-slate-500">Total Members</p>
              </div>
            </div>
          </Card>
          <Card className="bg-white p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.activeMembers}</p>
                <p className="text-sm text-slate-500">Active Members</p>
              </div>
            </div>
          </Card>
          <Card className="bg-white p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.recentRegistrations}</p>
                <p className="text-sm text-slate-500">New (30 days)</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Church Information */}
      <Card className="bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">Church Information</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Church className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">Church Name</p>
                <p className="font-medium">{church.name}</p>
              </div>
            </div>
            {church.address && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-500">Address</p>
                  <p className="font-medium">
                    {church.address}
                    {church.city && `, ${church.city}`}
                    {church.state && ` ${church.state}`}
                    {church.zipCode && ` ${church.zipCode}`}
                  </p>
                </div>
              </div>
            )}
            {church.subDistrict && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-500">Sub-District</p>
                  <p className="font-medium">{church.subDistrict.name}</p>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-4">
            {church.phone && (
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-500">Phone</p>
                  <p className="font-medium">{church.phone}</p>
                </div>
              </div>
            )}
            {church.email && (
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="font-medium">{church.email}</p>
                </div>
              </div>
            )}
            {church.pastor && (
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-500">Head Minister</p>
                  <p className="font-medium">{church.pastor.name}</p>
                  {church.pastor.phone && (
                    <p className="text-sm text-slate-500">{church.pastor.phone}</p>
                  )}
                  {church.pastor.email && (
                    <p className="text-sm text-slate-500">{church.pastor.email}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button asChild variant="outline" className="h-auto py-4 flex-col">
            <Link href="/admin/events">
              <Calendar className="w-6 h-6 mb-2" />
              <span>View Events</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-4 flex-col">
            <Link href="/admin/guests">
              <Users className="w-6 h-6 mb-2" />
              <span>Guests</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-4 flex-col">
            <Link href="/admin/campaigns">
              <Mail className="w-6 h-6 mb-2" />
              <span>Campaigns</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-4 flex-col">
            <Link href={`/cms/collections/users?where[church][equals]=${church.id}`}>
              <Users className="w-6 h-6 mb-2" />
              <span>Members</span>
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}

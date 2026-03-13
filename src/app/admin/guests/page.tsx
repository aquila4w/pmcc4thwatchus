"use client";

import { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Loader2,
  Search,
  Check,
  Sparkles,
  Church,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface EligibleGuest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  church?: {
    id: string;
    name: string;
  };
  subDistrict?: {
    id: string;
    name: string;
  };
  baptizedAt: string;
  baptizedEvent?: string;
  registrationId: string;
}

export default function GuestsPage() {
  const [guests, setGuests] = useState<EligibleGuest[]>([]);
  const [churches, setChurches] = useState<Array<{ id: string; name: string }>>([]);
  const [subDistricts, setSubDistricts] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChurch, setSelectedChurch] = useState<string>("");
  const [selectedSubDistrict, setSelectedSubDistrict] = useState<string>("");
  const [promotingGuest, setPromotingGuest] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get eligible baptized guests
      const guestsRes = await fetch("/api/guests/eligible");
      if (guestsRes.ok) {
        const guestsData = await guestsRes.json();
        setGuests(guestsData.guests || []);
      }

      // Get churches for filter
      const churchesRes = await fetch("/payload-api/churches?limit=999&depth=0");
      if (churchesRes.ok) {
        const churchesData = await churchesRes.json();
        setChurches(churchesData.docs || []);
      }

      // Get subdistricts for filter
      const subDistrictsRes = await fetch("/payload-api/sub-districts?limit=999&depth=0");
      if (subDistrictsRes.ok) {
        const subDistrictsData = await subDistrictsRes.json();
        setSubDistricts(subDistrictsData.docs || []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteGuest = async (guest: EligibleGuest) => {
    // Confirm church assignment
    if (!guest.church) {
      alert("This guest must be assigned to a church before promotion.");
      return;
    }

    const confirmed = confirm(
      `Promote ${guest.name} to member?\n\n` +
        `They will be assigned to: ${guest.church.name}\n\n` +
        `This action cannot be undone.`
    );

    if (!confirmed) return;

    setPromotingGuest(guest.id);
    try {
      const response = await fetch(`/api/guests/${guest.id}/promote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          churchId: guest.church.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`${guest.name} has been promoted to member!`);
        await fetchData();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to promote guest");
      }
    } catch (error) {
      console.error("Failed to promote guest:", error);
      alert("Failed to promote guest");
    } finally {
      setPromotingGuest(null);
    }
  };

  const filteredGuests = guests.filter((guest) => {
    const matchesSearch =
      guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.phone?.includes(searchTerm) ||
      guest.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesChurch =
      !selectedChurch || guest.church?.id === selectedChurch;
    const matchesSubDistrict =
      !selectedSubDistrict || guest.subDistrict?.id === selectedSubDistrict;
    return matchesSearch && matchesChurch && matchesSubDistrict;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Group by church
  const groupedGuests = filteredGuests.reduce((acc, guest) => {
    const churchName = guest.church?.name || "Unassigned";
    if (!acc[churchName]) {
      acc[churchName] = [];
    }
    acc[churchName].push(guest);
    return acc;
  }, {} as Record<string, EligibleGuest[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Guest Management</h1>
          <p className="text-slate-500">Promote baptized guests to members</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          <Users className="w-4 h-4 mr-1" />
          {guests.length} Eligible
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{guests.length}</p>
              <p className="text-xs text-slate-500">Baptized Guests</p>
            </div>
          </div>
        </Card>
        <Card className="bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Church className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {Object.keys(groupedGuests).length}
              </p>
              <p className="text-xs text-slate-500">Churches</p>
            </div>
          </div>
        </Card>
        <Card className="bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {guests.filter(g => g.church).length}
              </p>
              <p className="text-xs text-slate-500">Have Church</p>
            </div>
          </div>
        </Card>
        <Card className="bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {guests.filter(g => !g.church).length}
              </p>
              <p className="text-xs text-slate-500">Need Assignment</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={selectedChurch}
            onChange={(e) => setSelectedChurch(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">All Churches</option>
            {churches.map((church) => (
              <option key={church.id} value={church.id}>
                {church.name}
              </option>
            ))}
          </select>
          <select
            value={selectedSubDistrict}
            onChange={(e) => setSelectedSubDistrict(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">All Subdistricts</option>
            {subDistricts.map((sd) => (
              <option key={sd.id} value={sd.id}>
                {sd.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Guest List */}
      <div className="space-y-6">
        {Object.entries(groupedGuests).map(([churchName, churchGuests]) => (
          <Card key={churchName} className="bg-white p-6">
            <div className="flex items-center gap-2 mb-4">
              <Church className="w-5 h-5 text-slate-500" />
              <h3 className="font-semibold text-lg">{churchName}</h3>
              <Badge variant="secondary">{churchGuests.length} guests</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Guest</th>
                    <th className="text-left py-3 px-4">Contact</th>
                    <th className="text-left py-3 px-4">Baptized</th>
                    <th className="text-center py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {churchGuests.map((guest) => (
                    <tr key={guest.id} className="border-b hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium">{guest.name}</p>
                            {guest.subDistrict && (
                              <p className="text-xs text-slate-500">
                                {guest.subDistrict.name}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {guest.phone && (
                          <p className="text-sm">{guest.phone}</p>
                        )}
                        {guest.email && (
                          <p className="text-sm text-slate-500">{guest.email}</p>
                        )}
                        {!guest.phone && !guest.email && (
                          <p className="text-sm text-slate-400">No contact info</p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span>{formatDate(guest.baptizedAt)}</span>
                        </div>
                        {guest.baptizedEvent && (
                          <p className="text-xs text-slate-500">
                            {guest.baptizedEvent}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          size="sm"
                          onClick={() => handlePromoteGuest(guest)}
                          disabled={promotingGuest === guest.id || !guest.church}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          {promotingGuest === guest.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Promote
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ))}
      </div>

      {filteredGuests.length === 0 && (
        <Card className="bg-white p-12 text-center">
          <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">
            No eligible guests found
          </h3>
          <p className="text-slate-500">
            Guests who have been baptized will appear here and can be promoted to
            members.
          </p>
        </Card>
      )}

      {/* Info Card */}
      <Card className="bg-purple-50 border-purple-200 p-6">
        <h3 className="font-semibold text-purple-900 mb-2">
          About Guest Promotion
        </h3>
        <ul className="space-y-2 text-purple-800">
          <li>• Only baptized guests are eligible for promotion to member</li>
          <li>• Promoted guests retain all event registration history</li>
          <li>• Each guest must be assigned to a church before promotion</li>
          <li>• Promoted guests receive a member invite code for future events</li>
          <li>• The promotion is logged with timestamp and promoter</li>
        </ul>
      </Card>
    </div>
  );
}

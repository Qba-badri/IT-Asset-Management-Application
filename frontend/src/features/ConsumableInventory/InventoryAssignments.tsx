import React, { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "../../components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { inventoryService, InventoryAssignment } from "../../services/consumableInventoryService";
import { useToast } from "../../context/ToastContext";
import { UserPlus, Calendar } from "lucide-react";

export default function InventoryAssignments() {
    const { showToast } = useToast();
    const [assignments, setAssignments] = useState<InventoryAssignment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAssignments();
    }, []);

    const loadAssignments = async () => {
        try {
            setLoading(true);
            const data = await inventoryService.getAssignments();
            setAssignments(data);
        } catch (error) {
            console.error("Failed to load assignments", error);
            showToast("Failed to load assignments", "error");
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'assigned': return <Badge>Assigned</Badge>;
            case 'returned': return <Badge variant="outline" className="text-green-600 border-green-600">Returned</Badge>;
            case 'closed': return <Badge variant="secondary">Closed</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-primary" />
                    Active Assignments
                </CardTitle>
                <CardDescription>Items currently issued to employees and users.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Assignee</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Item</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-10">Loading assignments...</TableCell>
                            </TableRow>
                        ) : assignments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-10">No active assignments found.</TableCell>
                            </TableRow>
                        ) : (
                            assignments.map((asgn) => (
                                <TableRow key={asgn.id}>
                                    <TableCell className="font-medium">
                                        {asgn.user ? `${asgn.user.firstName} ${asgn.user.lastName}` : `User ID: ${asgn.userId}`}
                                    </TableCell>
                                    <TableCell>{asgn.department || '—'}</TableCell>
                                    <TableCell>{asgn.item?.name}</TableCell>
                                    <TableCell className="text-right">{asgn.quantity}</TableCell>
                                    <TableCell className="text-xs">
                                        {new Date(asgn.assignmentDate).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-xs">
                                        {asgn.expectedReturnDate ? (
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(asgn.expectedReturnDate).toLocaleDateString()}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground italic text-[10px]">No return expected</span>
                                        )}
                                    </TableCell>
                                    <TableCell>{getStatusBadge(asgn.status)}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

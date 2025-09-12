/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
 
"use client";

import { useState, useEffect } from "react";
import Cookies from 'js-cookie';  
import { debounce } from 'lodash'; 
import PhysicianDialog from "@/components/physicians-dialog";
import { useTranslation } from "@/hooks/useTranslation";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Trash2, Edit } from "lucide-react";
import { normalize } from "path";

export interface Physician {
  Id: string;
  UserName: string;
  Name: string;
  Surname: string;
  EmailAddress: string;
  Password: string;
}

export default function PhysiciansGrid() {
  const { t } = useTranslation();
  const [physicians, setPhysicians] = useState<Physician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPhysician, setCurrentPhysician] = useState<Partial<Physician> | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [physicianToDelete, setPhysicianToDelete] = useState<string | null>(null); 
   const [showPassword, setShowPassword] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState(false);
const [errors, setErrors] = useState({
        UserName: "",
        Name: "",
        Password: "",
        EmailAddress: "",
    });

  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const getAuthToken = () => { 
    return Cookies.get('adminToken'); 
  };
 
  const fetchPhysicians = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/User/GetPhysicians`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      if (response.status === 401) {
        Cookies.set('adminToken', "");
        window.location.reload();
        return;
      }
      
      const data = await response.json();
      if (!data.IsSuccess) throw new Error("Failed to fetch physicians");
      
      setPhysicians(data.Result); 
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch physicians");
    } finally {
      setLoading(false);
    }
  };

  const debouncedGridFetch = debounce(() => {
      fetchPhysicians();
    }, 300);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPhysician) return;

    try {
      if (!validate()) {
            return;
      }

      const url = currentPhysician.Id ? `${apiUrl}/User/EditPhysician` : `${apiUrl}/User/AddPhysician`; 
      setIsSubmitting(true);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          Id: currentPhysician.Id,
          UserName: currentPhysician.UserName,
          Name: currentPhysician.Name,
          Surname: currentPhysician.Surname,
          EmailAddress: currentPhysician.EmailAddress,
          Password: currentPhysician.Password, 
        }),
      });

      if (response.status === 401) {
        Cookies.set('adminToken', "");
        window.location.reload();
        return;
      } 
      
      const responseJson = await response.json();
      if (!responseJson.IsSuccess) { 
        setSubmitError(responseJson.Message);
        return;
      }

      setSubmitError("");
      await fetchPhysicians();
      setIsDialogOpen(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('physicians.operationFailed'));
    } finally {
            setIsSubmitting(false);
    }
  };

  const validate = () => {
    const passwordErrors = validatePassword(currentPhysician?.Password ?? "");

        const newErrors = {
            UserName: currentPhysician?.UserName ? "" : "Required",
            Name: currentPhysician?.Name ? "" : "Required",
            Password: passwordErrors.length > 0 ? passwordErrors.join(". ") : "",
            EmailAddress: currentPhysician?.EmailAddress == "" ? t('physicians.required') : /^\S+@\S+$/.test(currentPhysician?.EmailAddress ?? "") ? "" : t('physicians.invalidEmail'),
        };

        setErrors(newErrors);
        return !Object.values(newErrors).some(Boolean);
    };

  //   const validatePassword = (password: string) => {
  //     const errors: string[] = [];
      
  //     if (currentPhysician?.Id == null && password == "") {
  //       errors.push("Required");
  //       return errors;
  //     } 
  //     if (password.length < 6) {
  //       errors.push("Must be at least 6 characters");
  //     }
  //     if (!/[^a-zA-Z0-9]/.test(password)) {
  //       errors.push("Must contain at least one special character");
  //     }
  //     if (!/[a-z]/.test(password)) {
  //       errors.push("Must contain at least one lowercase letter");
  //     }
  //     if (!/[A-Z]/.test(password)) {
  //       errors.push("Must contain at least one uppercase letter");
  //     }
  //     if (!/[0-9]/.test(password)) {
  //       errors.push("Must contain at least one digit");
  //     }

  //     return errors;
  // };

  const validatePassword = (password: string) => {
    const errors: string[] = [];
    if (parseInt(currentPhysician?.Id ?? "0") > 0 && password == "") {
      return errors;
    } 
        
    if (password.length < 6) {
      errors.push("Must be at least 6 characters");
    }
    if (!/[^a-zA-Z0-9]/.test(password)) {
      errors.push("Must contain at least one special character");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Must contain at least one lowercase letter");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Must contain at least one uppercase letter");
    }

    return errors;
};

  const getPasswordStrength = (password: string) => {
    const strength = [
      password.length >= 6,
      /[^a-zA-Z0-9]/.test(password),
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /[0-9]/.test(password),
    ].filter(Boolean).length;

    return {
      strength,
      label: [t('physicians.passwordStrength.veryWeak'), t('physicians.passwordStrength.weak'), t('physicians.passwordStrength.medium'), t('physicians.passwordStrength.strong'), t('physicians.passwordStrength.veryStrong')][strength - 1] || "",
      color: ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500", "bg-emerald-500"][strength - 1] || "",
    };
  };

  const handleSubmitPhysician  = async (physicianData: {
  UserName: string;
  Name: string;
  Surname: string;
  EmailAddress: string;
  Password: string;
}) : Promise<string> => {
    try {  
      const url = currentPhysician?.Id ? `${apiUrl}/User/EditPhysician` : `${apiUrl}/User/AddPhysician`; 

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(physicianData)
      });

      if (response.status === 401) {
        Cookies.set('adminToken', "");
        window.location.reload();
        return "";
      } 
      
      const responseJson = await response.json();
      if (!responseJson.IsSuccess) { 
        return responseJson.Message;
      }

      await fetchPhysicians(); 
      return "";
    } catch (error) {
      console.error('Error submitting physician:', error); 
      return "Error submitting physician";
    }
  };
 
  const handleDelete = async () => {
    if (!physicianToDelete) return;
    
    try {
      const response = await fetch(`${apiUrl}/User/DeletePhysician?userId=${physicianToDelete}`, {
        method: "DELETE",
        headers: { 
          'Authorization': `Bearer ${getAuthToken()}`
        } 
      });

      if (response.status === 401) {
        Cookies.set('adminToken', "");
        window.location.reload();
        return;
      }
      
      const responseJson = await response.json();
      if (!responseJson.IsSuccess) throw new Error(t('physicians.deleteFailed')); 

      setSubmitError("");
      await fetchPhysicians();
      setIsDeleteConfirmOpen(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('physicians.deleteFailed'));
    }
  };

  useEffect(() => {
  const checkAuthError = (error: any) => {
    if (error?.status === 401) { 
      Cookies.set('adminToken', "");
      window.location.reload(); // This will redirect to login
    }
  };

  const fetchData = async () => {
    try {
      debouncedGridFetch();
        return () => {
        debouncedGridFetch.cancel();
        }; 
    } catch (error) {
      checkAuthError(error);
    }
  };

  fetchData();
}, []);
   
  const openEditDialog = (physician: Physician) => {
    setCurrentPhysician({ ...physician });
    setErrors({
      UserName: "",
      Name: "",
      Password: "",
      EmailAddress: "",
    });
    setIsDialogOpen(true);
  };

  const getSelectedPhysician = () : Partial<Physician> | null =>{
    return currentPhysician;
  } 

  const openCreateDialog = () => {
    setCurrentPhysician({
      UserName: "",
      Name: "",
      Surname: "",
      EmailAddress: "",
      Password: ""
    });
    setErrors({
      UserName: "",
      Name: "",
      Password: "",
      EmailAddress: "",
    });

    setSubmitError("");
    setIsDialogOpen(true);
  };

  if (loading) return <div>{t('common.loadingPhysicians')}</div>;
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Physicians Management</h3>
        <Button onClick={openCreateDialog}>Add New Physician</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Surname</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {physicians.map((physician) => ( 
              <TableRow key={physician.Id}>
                <TableCell>{physician.UserName}</TableCell>
                <TableCell>{physician.Name}</TableCell>
                <TableCell>{physician.Surname}</TableCell>
                <TableCell>{physician.EmailAddress}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openEditDialog(physician)}
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setPhysicianToDelete(physician.Id);
                        setIsDeleteConfirmOpen(true);
                      }}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[600px] background-white">
                <DialogHeader>
                    {currentPhysician?.Id ? t('physicians.editPhysician') : t('physicians.addNewPhysician')}
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {/* Username Field */}
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="username" className="text-right mt-2">
                                Username
                            </Label>
                            <div className="col-span-3 space-y-1">
                                <Input
                                     id="physician-username"  
                                    name="physician-username"  
                                    autoComplete="new-username" 
                                    value={currentPhysician?.UserName || ""}
                                    onChange={(e) =>{
                                      setCurrentPhysician({ ...currentPhysician!, UserName: e.target.value, }) 
                                      setErrors({ ...errors, UserName: e.target.value ? "" : "Required" }); 
                                    }}
                                    className={errors.UserName ? "border-red-500" : ""} 
                                />
                                {errors.UserName && (
                                    <p className="text-sm text-red-500">{errors.UserName}</p>
                                )}
                            </div>
                        </div>

                        {/* Name Field */}
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="name" className="text-right mt-2">
                                Name
                            </Label>
                            <div className="col-span-3 space-y-1">
                                <Input
                                    id="name"
                                    value={currentPhysician?.Name || ""} 
                                    onChange={(e) =>{
                                      setCurrentPhysician({ ...currentPhysician!, Name: e.target.value, })  
                                        setErrors({ ...errors, Name: e.target.value ? "" : "Required" }); 
                                    }}
                                    className={errors.Name ? "border-red-500" : ""}
                                />
                                {errors.Name && (
                                    <p className="text-sm text-red-500">{errors.Name}</p>
                                )}
                            </div>
                        </div>

                        {/* Surname Field */}
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="surname" className="text-right mt-2">
                                Surname
                            </Label>
                            <div className="col-span-3 space-y-1">
                                <Input
                                    id="surname"
                                    value={currentPhysician?.Surname || ""}  
                                    onChange={(e) =>{
                                      setCurrentPhysician({ ...currentPhysician!, Surname: e.target.value, })  
                                    }}
                                />
                            </div>
                        </div>

                        {/* Email Field */}
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="email" className="text-right mt-2">
                                Email
                            </Label>
                            <div className="col-span-3 space-y-1">
                                <Input
                                    id="email"
                                    type="email"
                                   value={currentPhysician?.EmailAddress || ""}  
                                    onChange={(e) =>{
                                      setCurrentPhysician({ ...currentPhysician!, EmailAddress: e.target.value, })   
                                        setErrors({ ...errors, EmailAddress: e.target.value == "" ? t('physicians.required') : /^\S+@\S+$/.test(e.target.value) ? "" : t('physicians.invalidEmail') }); 
                                    }}
                                    className={errors.EmailAddress ? "border-red-500" : ""}
                                />
                                {errors.EmailAddress && (
                                    <p className="text-sm text-red-500">{errors.EmailAddress}</p>
                                )}
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="password" className="text-right mt-2"> Password </Label>

                            <div className="relative col-span-3 space-y-1"> 
                                <Input
                                   id="physician-password"  
                                    name="physician-password"  
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                     //value={currentPhysician?.Password || ""}   
                                    onChange={(e) =>{
                                      setCurrentPhysician({ ...currentPhysician!, Password: e.target.value, })   
                                        // setErrors({ ...errors, Password: e.target.value ? "" : "Required" }); 
                                    }}
                                    className={errors.Password ? "border-red-500 pr-10" : "pr-10"}
                                />

                                {/* Password Requirements List */}
                                <ul className="text-xs text-muted-foreground mt-1 pl-4 list-disc space-y-0.5">
                                  <li className={(currentPhysician?.Password?.length ?? 0) >= 6 ? "text-green-500" : "text-red-500"}>
                                    At least 6 characters
                                  </li>
                                  <li className={/[^a-zA-Z0-9]/.test(currentPhysician?.Password ?? "") ? "text-green-500" : "text-red-500"}>
                                    At least one special character
                                  </li>
                                  <li className={/[a-z]/.test(currentPhysician?.Password ?? "") ? "text-green-500" : "text-red-500"}>
                                    At least one lowercase letter
                                  </li>
                                  <li className={/[A-Z]/.test(currentPhysician?.Password ?? "") ? "text-green-500" : "text-red-500"}>
                                    At least one uppercase letter
                                  </li>
                                </ul>

                                {/* {currentPhysician?.Password && (
                                  <div className="mt-1">
                                    <div className="flex gap-1 h-1">
                                      {[1, 2, 3, 4, 5].map((i) => (
                                        <div 
                                          key={i}
                                          className={`flex-1 rounded-sm ${
                                            i <= getPasswordStrength(currentPhysician?.Password ?? "").strength 
                                              ? getPasswordStrength(currentPhysician?.Password ?? "").color 
                                              : "bg-gray-200"
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Strength: {getPasswordStrength(currentPhysician?.Password).label}
                                    </p>
                                  </div>
                                )} */}

                                {/* {errors.Password && (
                                    <p className="text-sm text-red-500">{errors.Password}</p>
                                )} */}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent items-normal"
                                    style={{alignItems: "normal"}}
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <span className="sr-only">
                                        {showPassword ? t('physicians.hidePassword') : t('physicians.showPassword')}
                                    </span>
                                </Button>
                            </div>
                        </div> 
                    </div>

                    <DialogFooter className="flex flex-col gap-2">
                        {submitError && (
                            <p className="text-sm text-red-500 w-full text-center">
                                {submitError}
                            </p>
                        )}
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full sm:w-auto"
                        >
                            {isSubmitting ? t('physicians.saving') : t('physicians.savePhysician')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>

        {/* Add/Edit Dialog */}
      {/* <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="background-white fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
          <DialogHeader>
            <DialogTitle>
              {currentPhysician?.Id ? t('physicians.editPhysician') : t('physicians.addNewPhysician')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="userName" className="text-right">
                  Username
                </Label>
                <Input
                  id="dialogUserName"
                  name="dialogUserName"
                  value={currentPhysician?.UserName || ""}
                  onChange={(e) =>
                    setCurrentPhysician({
                      ...currentPhysician!,
                      UserName: e.target.value,
                    })
                  }
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={currentPhysician?.Name || ""}
                  onChange={(e) =>
                    setCurrentPhysician({
                      ...currentPhysician!,
                      Name: e.target.value,
                    })
                  }
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="surname" className="text-right">
                  Surname
                </Label>
                <Input
                  id="surname"
                  value={currentPhysician?.Surname || ""}
                  onChange={(e) =>
                    setCurrentPhysician({
                      ...currentPhysician!,
                      Surname: e.target.value,
                    })
                  }
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={currentPhysician?.EmailAddress || ""}
                  onChange={(e) =>
                    setCurrentPhysician({
                      ...currentPhysician!,
                      EmailAddress: e.target.value,
                    })
                  }
                  className="col-span-3"
                  required
                />
              </div>
              {!currentPhysician?.Id && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">
                    Password
                  </Label>
                  <Input
                    id="dialogPassword"
                    name="dialogPassword"
                    type="password"
                    value={currentPhysician?.Password || ""}  
                    onChange={(e) =>
                        setCurrentPhysician({
                        ...currentPhysician!,
                        Password: e.target.value,
                        })
                    } 
                    className="col-span-3"
                  />
                </div>
              )} 
            </div>
            <DialogFooter>
              <Button type="submit">Save</Button>
              {submitError && (<div className="text-red-500" style={{float: "left"}}>{submitError}</div>)}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>  */}


      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="background-white fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this physician?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>

            {submitError && (<div className="text-red-500" style={{float: "left"}}>{submitError}</div>)}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
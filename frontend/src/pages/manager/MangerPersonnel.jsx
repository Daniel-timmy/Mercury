import { useEffect, useState } from "react";
import { Button, Card, CardBody, Divider } from "@heroui/react";
import { usePersonnelData } from "../../hooks/usePersonnelData";
import { useCreateUser } from "../../hooks/useCreateUser";
import { PersonnelTable } from "../../components/PersonnelTable";
import { CreatePersonnelModal } from "../../components/CreatePersonnelModal";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";

const ManagerPersonnel = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [manager, setManager] = useState(null);

  const {
    results: driverResults,
    count: driverCount,
    next: driverNext,
    previous: driverPrevious,
    loading: driverLoading,
    error: driverError,
    refetch: driverRefetch,
    fetchNext: driverFetchNext,
    fetchPrevious: driverFetchPrevious,
  } = usePersonnelData("users/drivers/");

  const {
    createUser,
    loading: createUserLoading,
    error: createUserError,
    success: createUserSuccess,
  } = useCreateUser();

  const handleCreatePersonnel = async (userData) => {
    const result = await createUser(userData);
    if (result) {
      // Refetch the appropriate list based on role
      if (userData.role === "driver") {
        driverRefetch();
      }
    }
  };
  useEffect(() => {
    const token = Cookies.get("access");
    if (!token) {
      // Redirect to login if no token is found
      window.location.href = "/login";
    }
    const decoded = jwtDecode(token);
    const mgr = JSON.parse(Cookies.get(decoded.user_id));
    setManager(mgr);
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Driver Management</h1>
        <Button color="primary" onPress={() => setIsModalOpen(true)}>
          Create New Driver
        </Button>
      </div>

      <div className="space-y-8">
        <Card>
          <CardBody>
            <PersonnelTable
              data={driverResults}
              loading={driverLoading}
              error={driverError}
              title="Drivers"
              count={driverCount}
              hasNext={!!driverNext}
              hasPrevious={!!driverPrevious}
              onNext={driverFetchNext}
              onPrevious={driverFetchPrevious}
              allManagers={manager ? [manager] : []}
            />
          </CardBody>
        </Card>
      </div>

      <CreatePersonnelModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreatePersonnel}
        loading={createUserLoading}
        error={createUserError}
        success={createUserSuccess}
        managers={manager ? [manager] : []}
      />
    </div>
  );
};

export default ManagerPersonnel;

import { useState } from "react";
import { Button, Card, CardBody, Divider } from "@heroui/react";
import { usePersonnelData } from "../../hooks/usePersonnelData";
import { useCreateUser } from "../../hooks/useCreateUser";
import { PersonnelTable } from "../../components/PersonnelTable";
import { CreatePersonnelModal } from "../../components/CreatePersonnelModal";

const AdminPersonnel = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    results: adminResults,
    count: adminCount,
    next: adminNext,
    previous: adminPrevious,
    loading: adminLoading,
    error: adminError,
    refetch: adminRefetch,
    fetchNext: adminFetchNext,
    fetchPrevious: adminFetchPrevious,
  } = usePersonnelData("users/admins/");

  const {
    results: managerResults,
    count: managerCount,
    next: managerNext,
    previous: managerPrevious,
    loading: managerLoading,
    error: managerError,
    refetch: managerRefetch,
    fetchNext: managerFetchNext,
    fetchPrevious: managerFetchPrevious,
  } = usePersonnelData("users/managers/");

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
    console.log(result);
    // if (result) {
    //   // Refetch the appropriate list based on role
    //   if (userData.role === "admin") {
    //     adminRefetch();
    //   } else if (userData.role === "manager") {
    //     managerRefetch();
    //   } else if (userData.role === "driver") {
    //     driverRefetch();
    //   }
    // }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Added ml-[240px] to provide space for the sidepanel */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Personnel Management</h1>
        <Button color="primary" onPress={() => setIsModalOpen(true)}>
          Create New Personnel
        </Button>
      </div>

      <div className="space-y-8">
        <Card>
          <CardBody>
            <PersonnelTable
              data={adminResults}
              loading={adminLoading}
              error={adminError}
              title="Admins"
              count={adminCount}
              hasNext={!!adminNext}
              hasPrevious={!!adminPrevious}
              onNext={adminFetchNext}
              onPrevious={adminFetchPrevious}
              allManagers={managerResults}
            />
          </CardBody>
        </Card>

        <Divider />

        <Card>
          <CardBody>
            <PersonnelTable
              data={managerResults}
              loading={managerLoading}
              error={managerError}
              title="Managers"
              count={managerCount}
              hasNext={!!managerNext}
              hasPrevious={!!managerPrevious}
              onNext={managerFetchNext}
              onPrevious={managerFetchPrevious}
              allManagers={managerResults}
            />
          </CardBody>
        </Card>

        <Divider />

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
              allManagers={managerResults}
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
        managers={managerResults}
      />
    </div>
  );
};

export default AdminPersonnel;

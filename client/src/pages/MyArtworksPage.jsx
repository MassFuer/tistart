import { Link } from "react-router-dom";
import { artworksAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import ArtworkCard from "../components/artwork/ArtworkCard";
import Pagination from "../components/common/Pagination";
import Loading from "../components/common/Loading";
import ErrorMessage from "../components/common/ErrorMessage";
import toast from "react-hot-toast";
import { useListing } from "../hooks/useListing";
import "./MyArtworksPage.css";

const MyArtworksPage = () => {
  const { user, isAdmin } = useAuth();

  const {
    data: artworks,
    loading: isLoading,
    error,
    pagination,
    setPage,
    refresh
  } = useListing({
    apiFetcher: artworksAPI.getAll,
    initialFilters: isAdmin ? {} : { artist: user._id },
  });

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this artwork?")) {
      return;
    }

    try {
      await artworksAPI.delete(id);
      toast.success("Artwork deleted successfully");
      refresh(); // Reload list to respect pagination
    } catch (error) {
      toast.error("Failed to delete artwork");
    }
  };

  if (isLoading) {
    return <Loading message="Loading artworks..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={refresh} />;
  }

  return (
    <div className="my-artworks-page">
      <div className="page-header">
        <div>
          <h1>{isAdmin ? "All Artworks" : "My Artworks"}</h1>
          <p>{isAdmin ? "Manage all artworks on the platform" : "Manage your artwork collection"}</p>
        </div>
        <Link to="/artworks/new" className="btn btn-primary">
          + New Artwork
        </Link>
      </div>

      {artworks.length === 0 ? (
        <div className="empty-state">
          <p>You haven&apos;t created any artworks yet</p>
          <Link to="/artworks/new" className="btn btn-primary">
            Create your first artwork
          </Link>
        </div>
      ) : (
        <>
          <div className="artwork-grid">
            {artworks.map((artwork) => (
              <ArtworkCard
                key={artwork._id}
                artwork={artwork}
                showActions={true}
                onDelete={handleDelete}
              />
            ))}
          </div>
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
};

export default MyArtworksPage;

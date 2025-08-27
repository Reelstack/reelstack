import React, { useState } from 'react';
import { useOMDB } from '../../hooks';

const MovieSearch: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const { searchMovies, loading, error, data } = useOMDB();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            searchMovies(searchQuery.trim());
        }
    };

    return (
        <div style={{
            padding: '20px',
            maxWidth: '800px',
            margin: '0 auto',
            color: '#ffffff'
        }}>
            <div style={{
                textAlign: 'center',
                marginBottom: '30px'
            }}>
                <h2 style={{
                    fontSize: '2rem',
                    fontWeight: '600',
                    color: '#667eea',
                    marginBottom: '10px'
                }}>
                    Movie Search
                </h2>
                <p style={{
                    fontSize: '1rem',
                    color: '#a0a0a0'
                }}>
                </p>
            </div>

            <form onSubmit={handleSearch} style={{
                marginBottom: '30px',
                display: 'flex',
                gap: '10px',
                justifyContent: 'center'
            }}>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Movie title..."
                    style={{
                        padding: '10px 15px',
                        fontSize: '16px',
                        width: '250px',
                        border: '1px solid #2a2a3e',
                        borderRadius: '6px',
                        backgroundColor: '#1a1a2e',
                        color: '#ffffff',
                        outline: 'none'
                    }}
                />
                <button
                    type="submit"
                    disabled={loading || !searchQuery.trim()}
                    style={{
                        padding: '10px 20px',
                        fontSize: '16px',
                        backgroundColor: '#667eea',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </form>

            {error && (
                <div style={{
                    color: '#ff6b6b',
                    padding: '15px',
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    borderRadius: '6px',
                    marginBottom: '20px',
                    textAlign: 'center'
                }}>
                    Error: {error}
                </div>
            )}

            {data && 'Search' in data && (
                <div>
                    <h3 style={{
                        fontSize: '1.3rem',
                        color: '#ffffff',
                        marginBottom: '20px',
                        textAlign: 'center'
                    }}>
                        {/* Results ({data.totalResults} found) */}
                    </h3>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '15px',
                        maxHeight: '500px',
                        overflowY: 'auto'
                    }}>
                        {data.Search.slice(0, 10).map((movie) => (
                            <div
                                key={movie.imdbID}
                                style={{
                                    backgroundColor: '#1a1a2e',
                                    border: '1px solid #2a2a3e',
                                    borderRadius: '8px',
                                    padding: '15px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '15px'
                                }}
                            >
                                <img
                                    src={movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/80x120/2a2a3e/ffffff?text=No+Poster'}
                                    alt={movie.Title}
                                    style={{
                                        width: '80px',
                                        height: '120px',
                                        borderRadius: '4px',
                                        objectFit: 'cover'
                                    }}
                                />
                                <div style={{ flex: 1 }}>
                                    <h4 style={{
                                        margin: '0 0 5px 0',
                                        fontSize: '1.1rem',
                                        color: '#ffffff'
                                    }}>
                                        {movie.Title}
                                    </h4>
                                    <p style={{
                                        margin: '0',
                                        color: '#a0a0a0',
                                        fontSize: '0.9rem'
                                    }}>
                                        {movie.Year} • {movie.Type}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {data && !('Search' in data) && (
                <div style={{
                    backgroundColor: '#1a1a2e',
                    border: '1px solid #2a2a3e',
                    borderRadius: '8px',
                    padding: '20px'
                }}>
                    <h3 style={{
                        fontSize: '1.3rem',
                        color: '#ffffff',
                        marginBottom: '15px'
                    }}>
                        Movie Details
                    </h3>
                    <pre style={{
                        backgroundColor: '#0f0f23',
                        color: '#a0a0a0',
                        padding: '15px',
                        borderRadius: '6px',
                        overflow: 'auto',
                        fontSize: '14px',
                        lineHeight: '1.4'
                    }}>
                        {JSON.stringify(data, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default MovieSearch;
